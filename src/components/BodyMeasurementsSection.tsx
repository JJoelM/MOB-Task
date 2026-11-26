"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  Ruler,
  Scale,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useMob } from "@/context/MobContext";
import { MORPHOLOGICAL_PROFILES } from "@/lib/fitness-domain";
import {
  getMeasurementGuide,
  getMeasurementSvgPath,
  MEASUREMENT_GUIDES,
} from "@/lib/measurement-guides";
import { MeasurementMode, MeasurementZone } from "@/types/mob";

interface FormDraft {
  sex: "male" | "female";
  heightCm: string;
  weightKg: string;
  neckCm: string;
  waistCm: string;
  hipCm: string;
  shouldersCm: string;
  chestCm: string;
  bicepsCm: string;
  thighCm: string;
  calfCm: string;
}

type FieldKey = keyof FormDraft;

function formatNumInput(val?: number): string {
  return val !== undefined && Number.isFinite(val) ? String(val) : "";
}

function parsePositiveDecimal(raw: string): number | undefined {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Number(parsed.toFixed(1));
}

export function BodyMeasurementsSection() {
  const { state, todayKey, addBodySnapshot, deleteBodySnapshot } = useMob();

  const sortedSnapshots = useMemo(
    () =>
      [...state.bodySnapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [state.bodySnapshots]
  );

  const latest = sortedSnapshots[sortedSnapshots.length - 1];
  const recentCheckins = useMemo(
    () => [...sortedSnapshots].reverse().slice(0, 4),
    [sortedSnapshots]
  );

  const [mode, setMode] = useState<MeasurementMode>(() =>
    state.duo.connected ? "assisted" : "solo"
  );
  const [activeZone, setActiveZone] = useState<MeasurementZone>("waist");
  const [showComplete, setShowComplete] = useState(false);

  const [draft, setDraft] = useState<FormDraft>(() => ({
    sex: latest?.sex ?? "male",
    heightCm: formatNumInput(latest?.heightCm ?? 175),
    weightKg: formatNumInput(latest?.weightKg ?? 75),
    neckCm: formatNumInput(latest?.neckCm ?? 38),
    waistCm: formatNumInput(latest?.waistCm ?? 83),
    hipCm: formatNumInput(latest?.hipCm),
    shouldersCm: formatNumInput(latest?.shouldersCm),
    chestCm: formatNumInput(latest?.chestCm),
    bicepsCm: formatNumInput(latest?.bicepsCm),
    thighCm: formatNumInput(latest?.thighCm),
    calfCm: formatNumInput(latest?.calfCm),
  }));

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const syncedLatestIdRef = useRef<string | undefined>(latest?.id);

  useEffect(() => {
    if (!latest || latest.id === syncedLatestIdRef.current) return;
    syncedLatestIdRef.current = latest.id;
    if (Object.keys(touched).length > 0) return;
    setDraft({
      sex: latest.sex,
      heightCm: formatNumInput(latest.heightCm),
      weightKg: formatNumInput(latest.weightKg),
      neckCm: formatNumInput(latest.neckCm),
      waistCm: formatNumInput(latest.waistCm),
      hipCm: formatNumInput(latest.hipCm),
      shouldersCm: formatNumInput(latest.shouldersCm),
      chestCm: formatNumInput(latest.chestCm),
      bicepsCm: formatNumInput(latest.bicepsCm),
      thighCm: formatNumInput(latest.thighCm),
      calfCm: formatNumInput(latest.calfCm),
    });
  }, [latest, touched]);

  const baseId = useId();
  const formHeadingId = `${baseId}-form-heading`;
  const completeRegionId = `${baseId}-complete-region`;

  const inputRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});

  const activeGuide = useMemo(
    () => getMeasurementGuide(activeZone),
    [activeZone]
  );

  const activeCues =
    mode === "solo" ? activeGuide.soloCues : activeGuide.assistedCues;

  const validateField = (
    key: FieldKey,
    currentDraft: FormDraft
  ): string | undefined => {
    const raw = currentDraft[key];
    if (key === "sex") return undefined;

    const val = parsePositiveDecimal(raw);
    const isRequired =
      key === "heightCm" ||
      key === "weightKg" ||
      key === "neckCm" ||
      key === "waistCm" ||
      (key === "hipCm" && currentDraft.sex === "female");

    if (!raw.trim()) {
      if (isRequired) {
        return key === "hipCm"
          ? "Requerida en mujer para estimar % grasa US Navy."
          : "Ingresa un valor numérico válido.";
      }
      return undefined;
    }

    if (val === undefined) {
      return "Usa un número positivo (ej. 82.5).";
    }

    if (key === "heightCm" && (val < 110 || val > 240)) {
      return "Ingresa tu estatura en cm (110–240).";
    }
    if (key === "weightKg" && (val < 30 || val > 280)) {
      return "Ingresa tu peso en kg (30–280).";
    }
    if (
      key === "waistCm" &&
      parsePositiveDecimal(currentDraft.neckCm) !== undefined &&
      currentDraft.sex === "male" &&
      val <= (parsePositiveDecimal(currentDraft.neckCm) ?? 0)
    ) {
      return "La cintura debe ser mayor que el cuello para US Navy.";
    }

    return undefined;
  };

  const handleFieldChange = (key: FieldKey, value: string) => {
    setSavedNotice(null);
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (errors[key]) {
        const nextErr = validateField(key, next);
        if (!nextErr) {
          setErrors((prevErr) => {
            const copy = { ...prevErr };
            delete copy[key];
            return copy;
          });
        }
      }
      return next;
    });
  };

  const handleFieldBlur = (key: FieldKey) => {
    if (!touched[key]) return;
    const msg = validateField(key, draft);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[key] = msg;
      else delete copy[key];
      return copy;
    });
  };

  const handleZonePillSelect = (zone: MeasurementZone) => {
    setActiveZone(zone);
    const guide = getMeasurementGuide(zone);
    if (guide.tier === "complete" && !showComplete) {
      setShowComplete(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const keysToCheck: FieldKey[] = [
      "heightCm",
      "weightKg",
      "neckCm",
      "waistCm",
      "hipCm",
      "shouldersCm",
      "chestCm",
      "bicepsCm",
      "thighCm",
      "calfCm",
    ];

    const nextErrors: Partial<Record<FieldKey, string>> = {};
    let firstInvalidKey: FieldKey | null = null;

    for (const k of keysToCheck) {
      const err = validateField(k, draft);
      if (err) {
        nextErrors[k] = err;
        if (!firstInvalidKey) firstInvalidKey = k;
      }
    }

    if (firstInvalidKey) {
      setErrors(nextErrors);
      const completeKeys: FieldKey[] = [
        "shouldersCm",
        "chestCm",
        "bicepsCm",
        "thighCm",
        "calfCm",
      ];
      if (completeKeys.includes(firstInvalidKey) && !showComplete) {
        setShowComplete(true);
      }
      requestAnimationFrame(() => {
        inputRefs.current[firstInvalidKey!]?.focus();
      });
      return;
    }

    setErrors({});
    const snapshot = addBodySnapshot({
      date: todayKey,
      sex: draft.sex,
      heightCm: parsePositiveDecimal(draft.heightCm)!,
      weightKg: parsePositiveDecimal(draft.weightKg)!,
      neckCm: parsePositiveDecimal(draft.neckCm)!,
      waistCm: parsePositiveDecimal(draft.waistCm)!,
      hipCm: parsePositiveDecimal(draft.hipCm),
      shouldersCm: parsePositiveDecimal(draft.shouldersCm),
      chestCm: parsePositiveDecimal(draft.chestCm),
      bicepsCm: parsePositiveDecimal(draft.bicepsCm),
      thighCm: parsePositiveDecimal(draft.thighCm),
      calfCm: parsePositiveDecimal(draft.calfCm),
      modeUsed: mode,
    });

    setSavedNotice(
      `Registro guardado (${snapshot.date}) · WHtR ${snapshot.waistToHeightRatio.toFixed(
        2
      )}`
    );
  };

  const profileMeta = latest
    ? MORPHOLOGICAL_PROFILES[latest.morphologicalProfile]
    : null;

  const isHealthyWhtr = latest ? latest.waistToHeightRatio < 0.5 : false;

  return (
    <div className="space-y-6">
      {/* 1. Top Diagnóstico Funcional SDT Card */}
      <section
        aria-label="Diagnóstico Funcional SDT"
        className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-sage-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-sage)]">
              <Scale className="w-3.5 h-3.5" aria-hidden="true" />
              Diagnóstico Funcional SDT
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              <Lock className="w-3 h-3 text-[var(--text-tertiary)]" aria-hidden="true" />
              100% privado · Solo en tu perfil
            </span>
          </div>

          {latest && (
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
              Último control: {latest.date}
            </span>
          )}
        </div>

        {latest && profileMeta ? (
          <>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {profileMeta.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                {profileMeta.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
              {/* US Navy Body Fat */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  % Grasa US Navy
                </div>
                <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                  {latest.estimatedBodyFatPct !== undefined
                    ? `${latest.estimatedBodyFatPct.toFixed(1)}%`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {latest.estimatedBodyFatPct !== undefined
                    ? `Estimación por perímetros (${latest.weightKg} kg)`
                    : "Añade cadera para calcular"}
                </div>
              </div>

              {/* Waist-to-Height Ratio */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Relación Cintura-Altura (WHtR)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {latest.waistToHeightRatio.toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isHealthyWhtr
                        ? "bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                        : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {isHealthyWhtr && (
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    )}
                    {isHealthyWhtr ? "< 0.50 óptimo" : "Meta < 0.50 óptimo"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  Cintura {latest.waistCm} cm / Altura {latest.heightCm} cm
                </div>
              </div>

              {/* Shoulder-to-Waist Ratio */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Relación Hombro-Cintura
                </div>
                <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                  {latest.shoulderToWaistRatio !== undefined
                    ? latest.shoulderToWaistRatio.toFixed(2)
                    : "Opcional"}
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {latest.shoulderToWaistRatio !== undefined
                    ? `Simetría estructural (${latest.shouldersCm} / ${latest.waistCm} cm)`
                    : "Activa medidas completas para ver proporción"}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Sin lecturas corporales registradas aún
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              Usa la guía visual de cinta métrica aquí debajo para guardar tu punto de partida tranquilo.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
          <CalendarClock
            className="w-4 h-4 shrink-0 text-[var(--accent-focus)]"
            aria-hidden="true"
          />
          <span>
            Control sugerido cada 7–14 días · Enfócate en la tendencia, no en un día aislado
          </span>
        </div>
      </section>

      {/* 2. Interactive SVG Tape Guide + New Snapshot Form (side-by-side desktop, stacked mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive SVG Tape Guide */}
        <section
          aria-label="Guía de Cinta Métrica"
          className="lg:col-span-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Técnica Estandarizada
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Ruler
                  className="w-4 h-4 text-[var(--accent-action)]"
                  aria-hidden="true"
                />
                Guía de Cinta Métrica
              </h3>
            </div>
            <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              {activeGuide.tier === "essential" ? "Esencial US Navy" : "Simetría"}
            </span>
          </div>

          {/* Segmented Mode Switch: Solo vs Con asistencia */}
          <div
            role="group"
            aria-label="Modo de medición"
            className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[var(--bg-muted)] p-1.5"
          >
            <button
              type="button"
              onClick={() => setMode("solo")}
              aria-pressed={mode === "solo"}
              className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === "solo"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Solo (Frente a espejo)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("assisted")}
              aria-pressed={mode === "assisted"}
              className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === "assisted"
                  ? "bg-[var(--bg-card)] text-[var(--accent-sage)] shadow-xs border border-[var(--border-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Con asistencia (Dúo / Amigo)</span>
            </button>
          </div>

          {/* Warm Dúo note when assisted + duo connected */}
          {mode === "assisted" && state.duo.connected && (
            <div className="rounded-2xl border border-[var(--accent-sage)]/35 bg-[var(--accent-sage-soft)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] leading-relaxed">
              <strong className="font-semibold text-[var(--accent-sage)]">
                Tip junto a {state.duo.partnerName}:
              </strong>{" "}
              {activeGuide.duoTip}
            </div>
          )}

          {/* Clickable Zone Pills */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-[var(--text-secondary)]">
              Zona anatómica (toca una zona o enfoca su casilla):
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Zonas corporales">
              {MEASUREMENT_GUIDES.map((guide) => {
                const isSelected = guide.zone === activeZone;
                return (
                  <button
                    key={guide.zone}
                    type="button"
                    onClick={() => handleZonePillSelect(guide.zone)}
                    aria-pressed={isSelected}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors border ${
                      isSelected
                        ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {guide.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SVG Technical Illustration */}
          <div className="space-y-2.5">
            <img
              src={getMeasurementSvgPath(activeZone, mode)}
              alt={`Ilustración técnica para medir ${activeGuide.label.toLowerCase()} en modo ${
                mode === "solo" ? "solo frente a espejo" : "con asistencia lateral"
              }`}
              width={320}
              height={220}
              className="w-full h-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
            />

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  {activeGuide.label}
                </h4>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {mode === "solo" ? "Espejo + auto-lectura" : "Lectura lateral asistida"}
                </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                {activeGuide.landmark}
              </p>
              <ul className="space-y-1.5 pt-1 text-xs text-[var(--text-secondary)]">
                {activeCues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-[var(--accent-action)]"
                      aria-hidden="true"
                    />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right Column: New Measurement Snapshot Form */}
        <section className="lg:col-span-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Check-in Antropométrico
            </span>
            <h3
              id={formHeadingId}
              className="text-base font-bold text-[var(--text-primary)]"
            >
              Nuevo Registro Corporal ({todayKey})
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Pre-cargado con tu último control para que actualizar tome menos de un minuto.
            </p>
          </div>

          <form
            aria-labelledby={formHeadingId}
            method="POST"
            action="#body-checkin"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            {/* Sex Radio Group (2 options exposed directly per modern-web-guidance forms) */}
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-semibold text-[var(--text-primary)]">
                Sexo biológico (fórmula US Navy)
              </legend>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {(
                  [
                    { value: "male", label: "Hombre" },
                    { value: "female", label: "Mujer" },
                  ] as const
                ).map((opt) => {
                  const radioId = `${baseId}-sex-${opt.value}`;
                  const checked = draft.sex === opt.value;
                  return (
                    <div
                      key={opt.value}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 min-h-12 transition-colors ${
                        checked
                          ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/60"
                          : "border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
                      }`}
                    >
                      <input
                        type="radio"
                        id={radioId}
                        name="sex"
                        value={opt.value}
                        checked={checked}
                        onChange={() => handleFieldChange("sex", opt.value)}
                        className="h-4 w-4 shrink-0"
                      />
                      <label
                        htmlFor={radioId}
                        className="text-sm font-medium text-[var(--text-primary)] cursor-pointer flex-1 py-2.5"
                      >
                        {opt.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Essential Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(
                [
                  {
                    key: "heightCm" as const,
                    label: "Altura (cm)",
                    required: true,
                    zone: undefined,
                    hint: "Ej. 178",
                  },
                  {
                    key: "weightKg" as const,
                    label: "Peso (kg)",
                    required: true,
                    zone: undefined,
                    hint: "Ej. 77.3",
                  },
                  {
                    key: "neckCm" as const,
                    label: "Cuello (cm)",
                    required: true,
                    zone: "neck" as MeasurementZone,
                    hint: "Bajo la nuez",
                  },
                  {
                    key: "waistCm" as const,
                    label: "Cintura (cm)",
                    required: true,
                    zone: "waist" as MeasurementZone,
                    hint: "Línea del ombligo",
                  },
                  {
                    key: "hipCm" as const,
                    label:
                      draft.sex === "female"
                        ? "Cadera (cm)"
                        : "Cadera (cm · opcional)",
                    required: draft.sex === "female",
                    zone: "hip" as MeasurementZone,
                    hint: "Mayor proyección glútea",
                  },
                ] as const
              ).map((field) => {
                const inputId = `${baseId}-${field.key}`;
                const errId = `${baseId}-${field.key}-err`;
                const fieldError = errors[field.key];
                return (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label
                      htmlFor={inputId}
                      className="text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {field.label}{" "}
                      {field.required && (
                        <span
                          aria-hidden="true"
                          className="text-[var(--accent-action)]"
                        >
                          *
                        </span>
                      )}
                    </label>
                    <input
                      ref={(el) => {
                        inputRefs.current[field.key] = el;
                      }}
                      id={inputId}
                      name={field.key}
                      type="text"
                      inputMode="decimal"
                      required={field.required}
                      value={draft[field.key]}
                      placeholder={field.hint}
                      aria-invalid={fieldError ? "true" : undefined}
                      aria-describedby={fieldError ? errId : undefined}
                      onFocus={() => {
                        if (field.zone) setActiveZone(field.zone);
                      }}
                      onChange={(e) => {
                        setTouched((prev) => ({ ...prev, [field.key]: true }));
                        handleFieldChange(field.key, e.target.value);
                      }}
                      onBlur={() => handleFieldBlur(field.key)}
                      className="min-h-12 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-base tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                    {fieldError && (
                      <span
                        id={errId}
                        className="text-[11px] font-medium text-[var(--accent-action)]"
                      >
                        {fieldError}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progressive Disclosure Toggle for Complete Symmetry Measurements */}
            <div className="pt-1">
              <button
                type="button"
                aria-expanded={showComplete}
                aria-controls={completeRegionId}
                onClick={() => setShowComplete((prev) => !prev)}
                className="w-full min-h-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between hover:bg-[var(--bg-muted)] transition-colors"
              >
                <span>Medidas completas de simetría (opcional)</span>
                {showComplete ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                )}
              </button>

              <div
                id={completeRegionId}
                hidden={!showComplete}
                className={showComplete ? "mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5" : "hidden"}
              >
                {(
                  [
                    {
                      key: "shouldersCm" as const,
                      label: "Hombros (cm)",
                      zone: "shoulders" as MeasurementZone,
                      hint: "Deltoides externos",
                    },
                    {
                      key: "chestCm" as const,
                      label: "Pecho (cm)",
                      zone: "chest" as MeasurementZone,
                      hint: "Línea media esternal",
                    },
                    {
                      key: "bicepsCm" as const,
                      label: "Bíceps (cm)",
                      zone: "biceps" as MeasurementZone,
                      hint: "Mitad hombro-codo",
                    },
                    {
                      key: "thighCm" as const,
                      label: "Muslo (cm)",
                      zone: "thigh" as MeasurementZone,
                      hint: "Muslo medio",
                    },
                    {
                      key: "calfCm" as const,
                      label: "Gemelo (cm)",
                      zone: "calf" as MeasurementZone,
                      hint: "Mayor perímetro",
                    },
                  ] as const
                ).map((field) => {
                  const inputId = `${baseId}-${field.key}`;
                  const errId = `${baseId}-${field.key}-err`;
                  const fieldError = errors[field.key];
                  return (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label
                        htmlFor={inputId}
                        className="text-xs font-semibold text-[var(--text-primary)]"
                      >
                        {field.label}
                      </label>
                      <input
                        ref={(el) => {
                          inputRefs.current[field.key] = el;
                        }}
                        id={inputId}
                        name={field.key}
                        type="text"
                        inputMode="decimal"
                        value={draft[field.key]}
                        placeholder={field.hint}
                        aria-invalid={fieldError ? "true" : undefined}
                        aria-describedby={fieldError ? errId : undefined}
                        onFocus={() => setActiveZone(field.zone)}
                        onChange={(e) => {
                          setTouched((prev) => ({ ...prev, [field.key]: true }));
                          handleFieldChange(field.key, e.target.value);
                        }}
                        onBlur={() => handleFieldBlur(field.key)}
                        className="min-h-12 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-base tabular-nums text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      />
                      {fieldError && (
                        <span
                          id={errId}
                          className="text-[11px] font-medium text-[var(--accent-action)]"
                        >
                          {fieldError}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-1 space-y-2">
              <button
                type="submit"
                className="w-full min-h-12 rounded-2xl bg-[var(--accent-action)] px-5 py-3 text-sm font-bold text-white hover:opacity-95 transition-opacity cursor-pointer"
              >
                Guardar control corporal ({mode === "solo" ? "Solo" : "Asistido"})
              </button>

              <div role="status" aria-live="polite" className="min-h-4">
                {savedNotice && (
                  <p className="text-xs font-medium text-[var(--accent-sage)] text-center">
                    {savedNotice}
                  </p>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* 3. Compact Recent Check-ins List (last 4 snapshots) */}
      <section
        aria-label="Controles corporales recientes"
        className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-3"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Últimos controles registrados
          </h3>
          <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
            Mostrando {recentCheckins.length} de {sortedSnapshots.length}
          </span>
        </div>

        {recentCheckins.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Aún no hay controles guardados.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentCheckins.map((snap) => (
              <div
                key={snap.id}
                className="py-3 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-3 tabular-nums"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {snap.date}
                    </span>
                    <span className="rounded-md bg-[var(--bg-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                      {snap.modeUsed === "assisted" ? "Con asistencia" : "Solo"}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {MORPHOLOGICAL_PROFILES[snap.morphologicalProfile].label}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Peso: {snap.weightKg} kg</span>
                    <span>Cintura: {snap.waistCm} cm</span>
                    <span>WHtR: {snap.waistToHeightRatio.toFixed(2)}</span>
                    {snap.estimatedBodyFatPct !== undefined && (
                      <span>Grasa US Navy: {snap.estimatedBodyFatPct.toFixed(1)}%</span>
                    )}
                    {snap.shouldersCm !== undefined && (
                      <span>Hombros: {snap.shouldersCm} cm</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteBodySnapshot(snap.id)}
                  aria-label={`Eliminar registro corporal del ${snap.date}`}
                  className="min-h-10 min-w-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-action)] hover:border-[var(--accent-action)] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Borrar</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
