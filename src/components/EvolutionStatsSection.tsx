"use client";

import React, { useId, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Download,
  Dumbbell,
  Lock,
  Ruler,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMob } from "@/context/MobContext";
import {
  buildEvolutionCsv,
  computeSeriesWithDeltas,
  filterByDayWindow,
  MORPHOLOGICAL_PROFILES,
} from "@/lib/fitness-domain";
import { formatHumanDate } from "@/lib/templates";
import { BodyMeasurementSnapshot } from "@/types/mob";

type EvolutionArea = "habits" | "gym" | "body";
type DayWindowOption = 28 | 90 | "all";
type BodyMetricKey = "waist" | "weight" | "bodyFat" | "shoulders" | "biceps";

interface BodyMetricMeta {
  key: BodyMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
  positiveDirection: "down" | "up" | "neutral";
  extract: (snap: BodyMeasurementSnapshot) => number | undefined;
}

const BODY_METRICS: BodyMetricMeta[] = [
  {
    key: "waist",
    label: "Cintura (cm)",
    shortLabel: "Cintura",
    unit: "cm",
    decimals: 1,
    positiveDirection: "down",
    extract: (s) => s.waistCm,
  },
  {
    key: "weight",
    label: "Peso (kg)",
    shortLabel: "Peso",
    unit: "kg",
    decimals: 1,
    positiveDirection: "neutral",
    extract: (s) => s.weightKg,
  },
  {
    key: "bodyFat",
    label: "% Grasa US Navy",
    shortLabel: "% Grasa US Navy",
    unit: "%",
    decimals: 1,
    positiveDirection: "down",
    extract: (s) => s.estimatedBodyFatPct,
  },
  {
    key: "shoulders",
    label: "Hombros (cm)",
    shortLabel: "Hombros",
    unit: "cm",
    decimals: 1,
    positiveDirection: "up",
    extract: (s) => s.shouldersCm,
  },
  {
    key: "biceps",
    label: "Bíceps (cm)",
    shortLabel: "Bíceps",
    unit: "cm",
    decimals: 1,
    positiveDirection: "up",
    extract: (s) => s.bicepsCm,
  },
];

const WINDOW_OPTIONS: Array<{ value: DayWindowOption; label: string }> = [
  { value: 28, label: "4 sem" },
  { value: 90, label: "3 meses" },
  { value: "all", label: "Todo" },
];

interface NormalizedPoint {
  id: string;
  date: string;
  value: number;
  formattedValue: string;
  deltaFromPrev: number | null;
  deltaFromFirst: number;
  formattedDeltaPrev: string;
  isPositiveDelta: boolean;
  detailText: string;
  badgeText?: string;
}

interface DailyHabitSummary {
  date: string;
  bronze: number;
  silver: number;
  gold: number;
  totalMedals: number;
  minutes: number;
}

function formatNum(val: number, decimals = 1): string {
  if (!Number.isFinite(val)) return "0";
  const rounded = Number(val.toFixed(decimals));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

function formatSignedDelta(
  delta: number | null,
  unit: string,
  decimals = 1
): string {
  if (delta === null || !Number.isFinite(delta)) return "Inicio";
  if (delta === 0) return `0 ${unit}`.trim();
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatNum(delta, decimals)} ${unit}`.trim();
}

function buildMonotoneSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) * 0.42;
    path += ` C ${(p0.x + dx).toFixed(1)} ${p0.y.toFixed(1)}, ${(
      p1.x - dx
    ).toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return path;
}

export function EvolutionStatsSection() {
  const { state, todayKey, setRequestedProgressTab } = useMob();

  const defaultExerciseId = useMemo(() => {
    const benchHasSets = state.gymSets.some((s) => s.exerciseId === "ex-bench");
    if (benchHasSets) return "ex-bench";
    const firstWithSets = state.gymExercises.find((ex) =>
      state.gymSets.some((s) => s.exerciseId === ex.id)
    );
    return (
      firstWithSets?.id ??
      state.gymExercises.find((ex) => ex.id === "ex-bench")?.id ??
      state.gymExercises[0]?.id ??
      ""
    );
  }, [state.gymExercises, state.gymSets]);

  const [activeArea, setActiveArea] = useState<EvolutionArea>(() =>
    state.habitLogs.length >= 2 ? "habits" : "gym"
  );
  const [dayWindow, setDayWindow] = useState<DayWindowOption>(90);
  const [selectedExerciseId, setSelectedExerciseId] =
    useState<string>(defaultExerciseId);
  const [selectedBodyMetric, setSelectedBodyMetric] =
    useState<BodyMetricKey>("waist");
  const [inspectedIdx, setInspectedIdx] = useState<number | null>(null);

  const captionId = useId();
  const exerciseSelectId = useId();
  const chartGradId = useId();

  const activeExercise = useMemo(
    () =>
      state.gymExercises.find((e) => e.id === selectedExerciseId) ??
      state.gymExercises[0],
    [state.gymExercises, selectedExerciseId]
  );

  const activeBodyMeta = useMemo(
    () =>
      BODY_METRICS.find((m) => m.key === selectedBodyMetric) ?? BODY_METRICS[0],
    [selectedBodyMetric]
  );

  // 1. Aggregate Habits & Inertia Daily Series
  const habitsAnalysis = useMemo(() => {
    const byDate = new Map<string, DailyHabitSummary>();

    const ensureDay = (date: string): DailyHabitSummary => {
      const existing = byDate.get(date);
      if (existing) return existing;
      const created: DailyHabitSummary = {
        date,
        bronze: 0,
        silver: 0,
        gold: 0,
        totalMedals: 0,
        minutes: 0,
      };
      byDate.set(date, created);
      return created;
    };

    for (const log of state.habitLogs) {
      const entry = ensureDay(log.date);
      entry[log.tier] += 1;
      entry.totalMedals += 1;
      entry.minutes += log.minutesLogged || 0;
    }

    for (const task of state.tasks) {
      if (!task.completed) continue;
      const dateKey = task.completedAt
        ? task.completedAt.slice(0, 10)
        : task.scheduledDate;
      const tier = task.completedTier ?? (task.isMainMission ? "gold" : "silver");
      const entry = ensureDay(dateKey);
      entry[tier] += 1;
      entry.totalMedals += 1;
    }

    const allDaily = Array.from(byDate.values());
    const windowed = filterByDayWindow(
      allDaily,
      (d) => d.date,
      todayKey,
      dayWindow
    );
    const series = computeSeriesWithDeltas(
      windowed,
      (d) => d.date,
      (d) => d.totalMedals
    );

    let bronzeTotal = 0;
    let silverTotal = 0;
    let goldTotal = 0;
    let minutesTotal = 0;
    for (const entry of windowed) {
      bronzeTotal += entry.bronze;
      silverTotal += entry.silver;
      goldTotal += entry.gold;
      minutesTotal += entry.minutes;
    }

    const points: NormalizedPoint[] = series.map((s) => {
      const d = s.item;
      const parts: string[] = [];
      if (d.gold > 0) parts.push(`${d.gold} Oro`);
      if (d.silver > 0) parts.push(`${d.silver} Plata`);
      if (d.bronze > 0) parts.push(`${d.bronze} Bronce`);
      if (d.minutes > 0) parts.push(`${d.minutes} min`);

      return {
        id: `hab-day-${s.date}`,
        date: s.date,
        value: s.value,
        formattedValue: `${s.value} ${s.value === 1 ? "medalla" : "medallas"}`,
        deltaFromPrev: s.deltaFromPrev,
        deltaFromFirst: s.deltaFromFirst,
        formattedDeltaPrev: formatSignedDelta(s.deltaFromPrev, "med.", 0),
        isPositiveDelta: s.deltaFromPrev !== null && s.deltaFromPrev > 0,
        detailText: parts.join(" · ") || "Acción registrada",
      };
    });

    return {
      points,
      bronzeTotal,
      silverTotal,
      goldTotal,
      minutesTotal,
      activeDaysCount: windowed.length,
    };
  }, [state.habitLogs, state.tasks, todayKey, dayWindow]);

  // 2. Aggregate Gym / Strength Series
  const gymAnalysis = useMemo(() => {
    const targetId = activeExercise?.id ?? "";
    const forExercise = state.gymSets.filter((s) => s.exerciseId === targetId);
    const windowed = filterByDayWindow(
      forExercise,
      (s) => s.date,
      todayKey,
      dayWindow
    );
    const series = computeSeriesWithDeltas(
      windowed,
      (s) => s.date,
      (s) => s.estimated1RmKg
    );

    const best1Rm =
      windowed.length > 0
        ? Math.max(...windowed.map((s) => s.estimated1RmKg))
        : null;
    const bestSet =
      best1Rm !== null
        ? windowed.find((s) => s.estimated1RmKg === best1Rm)
        : undefined;
    const totalVolume = windowed.reduce((acc, s) => acc + s.volumeKg, 0);
    const cumulativeDelta =
      series.length > 0 ? series[series.length - 1].deltaFromFirst : null;

    const points: NormalizedPoint[] = series.map((s) => ({
      id: s.item.id,
      date: s.date,
      value: s.value,
      formattedValue: `${s.value.toFixed(1)} kg`,
      deltaFromPrev: s.deltaFromPrev,
      deltaFromFirst: s.deltaFromFirst,
      formattedDeltaPrev: formatSignedDelta(s.deltaFromPrev, "kg", 1),
      isPositiveDelta: s.deltaFromPrev !== null && s.deltaFromPrev > 0,
      detailText: `${formatNum(s.item.weightKg, 1)} kg × ${
        s.item.reps
      } reps · Vol ${formatNum(s.item.volumeKg, 0)} kg`,
      badgeText: s.item.isPr ? "PR" : undefined,
    }));

    return {
      points,
      best1Rm,
      bestSet,
      totalVolume,
      setsCount: windowed.length,
      cumulativeDelta,
    };
  }, [activeExercise, state.gymSets, todayKey, dayWindow]);

  // 3. Aggregate Body & Measurements Series
  const bodyAnalysis = useMemo(() => {
    const windowedAll = filterByDayWindow(
      state.bodySnapshots,
      (b) => b.date,
      todayKey,
      dayWindow
    );
    const validSnapshots = windowedAll.filter(
      (b) => activeBodyMeta.extract(b) !== undefined
    );
    const series = computeSeriesWithDeltas(
      validSnapshots,
      (b) => b.date,
      (b) => activeBodyMeta.extract(b) as number
    );

    const overallSorted = [...state.bodySnapshots].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const latestOverall = overallSorted[overallSorted.length - 1];
    const latestInSeries =
      series.length > 0 ? series[series.length - 1] : undefined;

    const isDeltaGood = (delta: number | null): boolean => {
      if (delta === null || delta === 0) return false;
      if (activeBodyMeta.positiveDirection === "down") return delta < 0;
      if (activeBodyMeta.positiveDirection === "up") return delta > 0;
      return false;
    };

    const points: NormalizedPoint[] = series.map((s) => {
      const snap = s.item;
      const profileLabel = MORPHOLOGICAL_PROFILES[snap.morphologicalProfile].label;
      const modeLabel = snap.modeUsed === "assisted" ? "Asistido" : "Solo";
      return {
        id: snap.id,
        date: s.date,
        value: s.value,
        formattedValue: `${s.value.toFixed(activeBodyMeta.decimals)} ${
          activeBodyMeta.unit
        }`,
        deltaFromPrev: s.deltaFromPrev,
        deltaFromFirst: s.deltaFromFirst,
        formattedDeltaPrev: formatSignedDelta(
          s.deltaFromPrev,
          activeBodyMeta.unit,
          activeBodyMeta.decimals
        ),
        isPositiveDelta: isDeltaGood(s.deltaFromPrev),
        detailText: `WHtR ${snap.waistToHeightRatio.toFixed(
          2
        )} · ${profileLabel} (${modeLabel})`,
      };
    });

    return {
      points,
      latestOverall,
      latestInSeries,
      isPeriodDeltaGood: latestInSeries
        ? isDeltaGood(latestInSeries.deltaFromFirst)
        : false,
    };
  }, [state.bodySnapshots, todayKey, dayWindow, activeBodyMeta]);

  const activePoints: NormalizedPoint[] =
    activeArea === "habits"
      ? habitsAnalysis.points
      : activeArea === "gym"
      ? gymAnalysis.points
      : bodyAnalysis.points;

  //Newest-first rows for the Layer 2 responsive table
  const newestFirstRows = useMemo(
    () => [...activePoints].reverse(),
    [activePoints]
  );

  // Active point for the interactive SVG chart
  const safeInspectedIndex =
    activePoints.length === 0
      ? -1
      : inspectedIdx !== null &&
        inspectedIdx >= 0 &&
        inspectedIdx < activePoints.length
      ? inspectedIdx
      : activePoints.length - 1;

  const inspectedPoint =
    safeInspectedIndex >= 0 ? activePoints[safeInspectedIndex] : null;

  // Table metadata & CSV columns
  const tableConfig = useMemo(() => {
    if (activeArea === "gym") {
      return {
        caption: `Historial de evolución en ${
          activeExercise?.name ?? "ejercicio"
        }`,
        col1: "Fecha",
        col2: "1RM estimado",
        col3: "Δ vs anterior",
        col4: "Serie y volumen",
        chartTitle: `Curva de 1RM estimado · ${
          activeExercise?.name ?? "Fuerza"
        }`,
        strokeVar: "var(--accent-sage)",
        unit: "kg",
      };
    }
    if (activeArea === "body") {
      return {
        caption: `Historial corporal de ${activeBodyMeta.label}`,
        col1: "Fecha",
        col2: activeBodyMeta.label,
        col3: "Δ vs anterior",
        col4: "Proporción y modo",
        chartTitle: `Curva corporal · ${activeBodyMeta.label}`,
        strokeVar: "var(--accent-action)",
        unit: activeBodyMeta.unit,
      };
    }
    return {
      caption: "Historial diario de hábitos y medallas",
      col1: "Fecha",
      col2: "Medallas del día",
      col3: "Δ vs anterior",
      col4: "Desglose B / P / O",
      chartTitle: "Curva de consistencia · Medallas por día activo",
      strokeVar: "var(--accent-action)",
      unit: "",
    };
  }, [activeArea, activeExercise, activeBodyMeta]);

  // SVG Chart Geometry (viewBox="0 0 640 200")
  const chartGeometry = useMemo(() => {
    const width = 640;
    const height = 200;
    const padLeft = 54;
    const padRight = 24;
    const padTop = 22;
    const padBottom = 32;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (activePoints.length < 2) {
      return null;
    }

    const rawValues = activePoints.map((p) => p.value);
    const minRaw = Math.min(...rawValues);
    const maxRaw = Math.max(...rawValues);
    const span = maxRaw - minRaw;
    const paddingVal = span === 0 ? Math.max(1, minRaw * 0.08) : span * 0.14;
    const yMin = Math.max(0, minRaw - paddingVal);
    const yMax = maxRaw + paddingVal;
    const yRange = yMax - yMin || 1;

    const coords = activePoints.map((pt, idx) => {
      const x =
        padLeft + (idx / Math.max(1, activePoints.length - 1)) * plotW;
      const y = padTop + plotH - ((pt.value - yMin) / yRange) * plotH;
      return { x, y, pt, idx };
    });

    const linePath = buildMonotoneSmoothPath(coords);
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const baselineY = padTop + plotH;
    const areaPath = `${linePath} L ${lastX.toFixed(1)} ${baselineY.toFixed(
      1
    )} L ${firstX.toFixed(1)} ${baselineY.toFixed(1)} Z`;

    const gridTicks = [
      { y: padTop, val: yMax },
      { y: padTop + plotH / 2, val: (yMax + yMin) / 2 },
      { y: baselineY, val: yMin },
    ];

    return {
      coords,
      linePath,
      areaPath,
      gridTicks,
      padLeft,
      padRight,
      padTop,
      baselineY,
      width,
    };
  }, [activePoints]);

  const handleExportCsv = () => {
    if (newestFirstRows.length === 0) return;

    const headers = [
      tableConfig.col1,
      tableConfig.col2,
      tableConfig.col3,
      tableConfig.col4,
    ];
    const rows = newestFirstRows.map((row) => [
      row.date,
      row.formattedValue,
      row.formattedDeltaPrev,
      row.badgeText ? `${row.detailText} (${row.badgeText})` : row.detailText,
    ]);

    const csvContent = buildEvolutionCsv(headers, rows);
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mob-evolucion-${activeArea}-${todayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar: Area Switcher + Time Window Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Área de evolución"
          className="inline-flex flex-wrap gap-1.5"
        >
          {(
            [
              {
                id: "habits" as const,
                label: "Hábitos e Inercia",
                icon: Activity,
              },
              {
                id: "gym" as const,
                label: "Fuerza / Gimnasio",
                icon: Dumbbell,
              },
              {
                id: "body" as const,
                label: "Cuerpo y Medidas",
                icon: Ruler,
              },
            ] as const
          ).map((area) => {
            const Icon = area.icon;
            const selected = activeArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setActiveArea(area.id);
                  setInspectedIdx(null);
                }}
                className={`min-h-10 inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-canvas)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{area.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Window Selector */}
        <div
          role="group"
          aria-label="Ventana de tiempo"
          className="inline-flex self-start sm:self-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1"
        >
          {WINDOW_OPTIONS.map((win) => {
            const active = dayWindow === win.value;
            return (
              <button
                key={String(win.value)}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDayWindow(win.value);
                  setInspectedIdx(null);
                }}
                className={`min-h-8 rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  active
                    ? "bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {win.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Sub-Selector for Fuerza / Gimnasio */}
      {activeArea === "gym" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
          <label
            htmlFor={exerciseSelectId}
            className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            Ejercicio analizado
          </label>
          <select
            id={exerciseSelectId}
            value={activeExercise?.id ?? ""}
            onChange={(e) => {
              setSelectedExerciseId(e.target.value);
              setInspectedIdx(null);
            }}
            className="min-h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-1.5 text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            {state.gymExercises.map((ex) => {
              const count = state.gymSets.filter(
                (s) => s.exerciseId === ex.id
              ).length;
              return (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({count} {count === 1 ? "serie" : "series"})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Contextual Sub-Selector + Privacy Badge for Cuerpo y Medidas */}
      {activeArea === "body" && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Métrica corporal
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
              <Lock
                className="w-3 h-3 text-[var(--text-tertiary)]"
                aria-hidden="true"
              />
              100% privado · Solo visible para ti
            </span>
          </div>

          <div
            role="group"
            aria-label="Seleccionar métrica corporal"
            className="flex flex-wrap gap-1.5"
          >
            {BODY_METRICS.map((metric) => {
              const active = selectedBodyMetric === metric.key;
              return (
                <button
                  key={metric.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedBodyMetric(metric.key);
                    setInspectedIdx(null);
                  }}
                  className={`min-h-9 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {metric.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
       * LAYER 1: Escaneo en 1 segundo (3 Delta Cards + Minimalist SVG Curve)
       * ==================================================================== */}
      {activeArea === "gym" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Mejor 1RM actual
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[var(--text-primary)]">
              {gymAnalysis.best1Rm !== null
                ? `${gymAnalysis.best1Rm.toFixed(1)} kg`
                : "—"}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {gymAnalysis.bestSet
                ? `Marca: ${formatNum(gymAnalysis.bestSet.weightKg, 1)} kg × ${
                    gymAnalysis.bestSet.reps
                  }`
                : "Sin series en este periodo"}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Mejora acumulada (Δ desde inicio)
            </div>
            <div
              className={`mt-1.5 text-2xl font-bold flex items-center gap-1.5 ${
                gymAnalysis.cumulativeDelta !== null &&
                gymAnalysis.cumulativeDelta > 0
                  ? "text-[var(--accent-sage)]"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {gymAnalysis.cumulativeDelta !== null &&
                gymAnalysis.cumulativeDelta > 0 && (
                  <TrendingUp className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
              <span>
                {gymAnalysis.cumulativeDelta !== null
                  ? formatSignedDelta(gymAnalysis.cumulativeDelta, "kg", 1)
                  : "—"}
              </span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Evolución de Epley 1RM en ventana activa
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Volumen total en periodo
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[var(--text-primary)]">
              {`${ gymAnalysis.totalVolume.toLocaleString("es-ES", {
                maximumFractionDigits: 0,
              })} kg`}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {gymAnalysis.setsCount}{" "}
              {gymAnalysis.setsCount === 1
                ? "serie registrada"
                : "series registradas"}
            </div>
          </div>
        </div>
      )}

      {activeArea === "body" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Último registro
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[var(--text-primary)]">
              {bodyAnalysis.latestInSeries
                ? `${bodyAnalysis.latestInSeries.value.toFixed(
                    activeBodyMeta.decimals
                  )} ${activeBodyMeta.unit}`
                : "—"}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {bodyAnalysis.latestInSeries
                ? `Control del ${formatHumanDate(
                    bodyAnalysis.latestInSeries.date
                  )}`
                : "Sin lecturas en este rango"}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Cambio en periodo (Δ)
            </div>
            <div
              className={`mt-1.5 text-2xl font-bold flex items-center gap-1.5 ${
                bodyAnalysis.isPeriodDeltaGood
                  ? "text-[var(--accent-sage)]"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {bodyAnalysis.isPeriodDeltaGood &&
                activeBodyMeta.positiveDirection === "down" && (
                  <TrendingDown
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                  />
                )}
              {bodyAnalysis.isPeriodDeltaGood &&
                activeBodyMeta.positiveDirection === "up" && (
                  <TrendingUp className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
              <span>
                {bodyAnalysis.latestInSeries
                  ? formatSignedDelta(
                      bodyAnalysis.latestInSeries.deltaFromFirst,
                      activeBodyMeta.unit,
                      activeBodyMeta.decimals
                    )
                  : "—"}
              </span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Comparado con el primer registro del periodo
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Relación Cintura-Altura actual
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {bodyAnalysis.latestOverall
                  ? bodyAnalysis.latestOverall.waistToHeightRatio.toFixed(2)
                  : "—"}
              </span>
              {bodyAnalysis.latestOverall && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    bodyAnalysis.latestOverall.waistToHeightRatio < 0.5
                      ? "bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                      : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  }`}
                >
                  {bodyAnalysis.latestOverall.waistToHeightRatio < 0.5
                    ? "< 0.50 óptimo"
                    : "Meta < 0.50"}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              100% privado · Solo visible para ti
            </div>
          </div>
        </div>
      )}

      {activeArea === "habits" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Inercia actual
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[var(--accent-sage)]">
              {state.momentum}%
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Impulso SDT sin caídas punitivas a cero
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Medallas en periodo (B / P / O)
            </div>
            <div className="mt-1.5 flex items-baseline gap-2 text-2xl font-bold">
              <span style={{ color: "var(--medal-bronze)" }}>
                {habitsAnalysis.bronzeTotal}
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">/</span>
              <span style={{ color: "var(--medal-silver)" }}>
                {habitsAnalysis.silverTotal}
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">/</span>
              <span style={{ color: "var(--medal-gold)" }}>
                {habitsAnalysis.goldTotal}
              </span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Bronce · Plata · Oro acumulados
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Días activos registrados
            </div>
            <div className="mt-1.5 text-2xl font-bold text-[var(--text-primary)]">
              {habitsAnalysis.activeDaysCount}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              {habitsAnalysis.minutesTotal > 0
                ? `${habitsAnalysis.minutesTotal} min enfocados en total`
                : "Días con al menos 1 medalla lograda"}
            </div>
          </div>
        </div>
      )}

      {/* Curva Minimalista SVG Interactiva */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Tendencia Longitudinal
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {tableConfig.chartTitle}
            </h3>
          </div>

          {inspectedPoint && (
            <div
              aria-live="polite"
              className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs tabular-nums"
            >
              <span className="font-semibold text-[var(--text-secondary)]">
                {formatHumanDate(inspectedPoint.date)} ({inspectedPoint.date})
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {inspectedPoint.formattedValue}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-bold ${
                  inspectedPoint.isPositiveDelta
                    ? "bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                }`}
              >
                Δ {inspectedPoint.formattedDeltaPrev}
              </span>
            </div>
          )}
        </div>

        {activePoints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] p-6 text-center space-y-2.5">
            <Sparkles
              className="w-5 h-5 mx-auto text-[var(--accent-action)]"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Aún no hay registros en esta ventana de tiempo
            </p>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              {activeArea === "gym"
                ? "Registra una serie rápida en Fuerza / Gym o amplía el rango a «Todo» para visualizar tu progresión de cargas."
                : activeArea === "body"
                ? "Guarda un control tranquilo en Cuerpo / Medidas o selecciona otra métrica para trazar tu curva."
                : "Completa un hábito hoy (incluso en nivel Bronce de 2 min) para iniciar tu historial de consistencia."}
            </p>
            {activeArea === "gym" && (
              <button
                type="button"
                onClick={() => setRequestedProgressTab("gym")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-action)] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Ir a Fuerza / Gym
              </button>
            )}
            {activeArea === "body" && (
              <button
                type="button"
                onClick={() => setRequestedProgressTab("body")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-action)] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Ir a Cuerpo / Medidas
              </button>
            )}
          </div>
        ) : activePoints.length === 1 ? (
          <div className="space-y-2">
            <svg
              viewBox="0 0 640 200"
              role="img"
              aria-label={`${tableConfig.chartTitle}: 1 punto registrado (${activePoints[0].formattedValue} el ${activePoints[0].date})`}
              className="w-full h-auto rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
            >
              <line
                x1="48"
                y1="100"
                x2="592"
                y2="100"
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
                strokeWidth="1.25"
              />
              <circle
                cx="320"
                cy="100"
                r="14"
                fill={tableConfig.strokeVar}
                fillOpacity="0.16"
              />
              <circle
                cx="320"
                cy="100"
                r="6"
                fill={tableConfig.strokeVar}
                stroke="var(--bg-card)"
                strokeWidth="2.5"
              />
              <text
                x="320"
                y="74"
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="13"
                fontWeight="700"
                className="tabular-nums"
              >
                {activePoints[0].formattedValue}
              </text>
              <text
                x="320"
                y="132"
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                className="tabular-nums"
              >
                {formatHumanDate(activePoints[0].date)} ({activePoints[0].date})
              </text>
            </svg>
            <p className="text-xs text-[var(--text-secondary)] text-center">
              Punto base registrado · Con el próximo control se dibujará automáticamente tu pendiente de evolución.
            </p>
          </div>
        ) : (
          chartGeometry && (
            <div className="space-y-1.5">
              <svg
                viewBox="0 0 640 200"
                role="group"
                aria-label={`${tableConfig.chartTitle} con ${activePoints.length} registros. Toca o enfoca cualquier punto para inspeccionar su valor exacto.`}
                className="w-full h-auto rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] select-none"
              >
                <defs>
                  <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={tableConfig.strokeVar}
                      stopOpacity="0.22"
                    />
                    <stop
                      offset="100%"
                      stopColor={tableConfig.strokeVar}
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                {chartGeometry.gridTicks.map((tick, idx) => (
                  <g key={idx}>
                    <line
                      x1={chartGeometry.padLeft}
                      y1={tick.y}
                      x2={chartGeometry.width - chartGeometry.padRight}
                      y2={tick.y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={chartGeometry.padLeft - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      fill="var(--text-tertiary)"
                      fontSize="10.5"
                      className="tabular-nums"
                    >
                      {formatNum(
                        tick.val,
                        activeArea === "habits" ? 0 : 1
                      )}
                    </text>
                  </g>
                ))}

                {/* Active inspected vertical guide */}
                {safeInspectedIndex >= 0 &&
                  chartGeometry.coords[safeInspectedIndex] && (
                    <line
                      x1={chartGeometry.coords[safeInspectedIndex].x}
                      y1={chartGeometry.padTop}
                      x2={chartGeometry.coords[safeInspectedIndex].x}
                      y2={chartGeometry.baselineY}
                      stroke="var(--border-strong)"
                      strokeDasharray="3 3"
                      strokeWidth="1.25"
                    />
                  )}

                {/* Soft area fill + Smooth trend curve */}
                <path
                  d={chartGeometry.areaPath}
                  fill={`url(#${chartGradId})`}
                />
                <path
                  d={chartGeometry.linePath}
                  fill="none"
                  stroke={tableConfig.strokeVar}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* First & Last X-axis Date Anchors */}
                <text
                  x={chartGeometry.coords[0].x}
                  y={190}
                  textAnchor="start"
                  fill="var(--text-tertiary)"
                  fontSize="10.5"
                  className="tabular-nums"
                >
                  {formatHumanDate(chartGeometry.coords[0].pt.date)}
                </text>
                <text
                  x={chartGeometry.coords[chartGeometry.coords.length - 1].x}
                  y={190}
                  textAnchor="end"
                  fill="var(--text-tertiary)"
                  fontSize="10.5"
                  className="tabular-nums"
                >
                  {formatHumanDate(
                    chartGeometry.coords[chartGeometry.coords.length - 1].pt
                      .date
                  )}
                </text>

                {/* Interactive Chronological Points */}
                {chartGeometry.coords.map(({ x, y, pt, idx }) => {
                  const isActive = idx === safeInspectedIndex;
                  return (
                    <g
                      key={pt.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${formatHumanDate(pt.date)} (${pt.date}): ${
                        pt.formattedValue
                      }, variación ${pt.formattedDeltaPrev}`}
                      onMouseEnter={() => setInspectedIdx(idx)}
                      onFocus={() => setInspectedIdx(idx)}
                      onClick={() => setInspectedIdx(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setInspectedIdx(idx);
                        } else if (
                          e.key === "ArrowLeft" &&
                          idx > 0
                        ) {
                          e.preventDefault();
                          setInspectedIdx(idx - 1);
                        } else if (
                          e.key === "ArrowRight" &&
                          idx < chartGeometry.coords.length - 1
                        ) {
                          e.preventDefault();
                          setInspectedIdx(idx + 1);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      <circle cx={x} cy={y} r={16} fill="transparent" />
                      {isActive && (
                        <circle
                          cx={x}
                          cy={y}
                          r={10}
                          fill={tableConfig.strokeVar}
                          fillOpacity="0.18"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? 5.75 : 4.25}
                        fill={
                          isActive ? tableConfig.strokeVar : "var(--bg-card)"
                        }
                        stroke={tableConfig.strokeVar}
                        strokeWidth="2.5"
                      />
                    </g>
                  );
                })}
              </svg>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Toca o pasa el cursor sobre cualquier punto para inspeccionar su fecha exacta y variación Δ.
              </p>
            </div>
          )
        )}
      </section>

      {/* ====================================================================
       * LAYER 2: Profundización (Responsive Sticky/Stacked Delta Table + CSV)
       * ==================================================================== */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Tabla detallada de evolución
            </h3>
            <p className="text-xs text-[var(--text-secondary)] tabular-nums">
              {newestFirstRows.length}{" "}
              {newestFirstRows.length === 1
                ? "registro mostrado"
                : "registros mostrados"}{" "}
              (más recientes primero)
            </p>
          </div>

          <button
            type="button"
            disabled={newestFirstRows.length === 0}
            onClick={handleExportCsv}
            className="min-h-10 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-action)] hover:text-[var(--accent-action)] disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="mob-table-wrapper rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
        >
          <table
            className="mob-evo-table tabular-nums"
            style={
              {
                "--col-2": JSON.stringify(tableConfig.col2),
                "--col-3": JSON.stringify(tableConfig.col3),
                "--col-4": JSON.stringify(tableConfig.col4),
              } as React.CSSProperties
            }
          >
            <caption id={captionId} className="sr-only">
              {tableConfig.caption}
            </caption>
            <thead>
              <tr>
                <th scope="col">{tableConfig.col1}</th>
                <th scope="col">{tableConfig.col2}</th>
                <th scope="col">{tableConfig.col3}</th>
                <th scope="col">{tableConfig.col4}</th>
              </tr>
            </thead>
            <tbody>
              {newestFirstRows.length === 0 ? (
                <tr>
                  <th scope="row">Sin datos</th>
                  <td>—</td>
                  <td>—</td>
                  <td className="text-[var(--text-secondary)]">
                    No hay registros dentro del periodo seleccionado.
                  </td>
                </tr>
              ) : (
                newestFirstRows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatHumanDate(row.date)}
                      </span>{" "}
                      <span className="text-xs font-normal text-[var(--text-tertiary)]">
                        ({row.date})
                      </span>
                    </th>
                    <td className="font-bold text-[var(--text-primary)]">
                      {row.formattedValue}
                    </td>
                    <td
                      className={
                        row.isPositiveDelta
                          ? "font-bold text-[var(--accent-sage)]"
                          : "font-medium text-[var(--text-secondary)]"
                      }
                    >
                      {row.formattedDeltaPrev}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span>{row.detailText}</span>
                        {row.badgeText && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: "var(--medal-gold)" }}
                          >
                            <Award
                              className="w-2.5 h-2.5 shrink-0"
                              aria-hidden="true"
                            />
                            {row.badgeText}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
