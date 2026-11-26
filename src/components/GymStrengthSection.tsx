"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Check,
  Dumbbell,
  Flame,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { GymExercise, GymMuscleGroup } from "@/types/mob";
import { useMob } from "@/context/MobContext";
import {
  calculateEpley1Rm,
  calculateSetVolume,
  isNewPersonalRecord,
} from "@/lib/fitness-domain";
import {
  getExerciseBestAndLast,
  GYM_QUICK_PACKS,
  MUSCLE_GROUP_META,
} from "@/lib/gym-templates";
import { formatHumanDate } from "@/lib/templates";
import { ModalDialog } from "@/components/ui/ModalDialog";

const MUSCLE_ORDER: GymMuscleGroup[] = ["push", "pull", "legs", "core"];

const QUICK_CUSTOM_SUGGESTIONS: Record<GymMuscleGroup, string[]> = {
  push: ["Press Inclinado Mancuernas", "Fondos en Paralelas", "Elevaciones Laterales"],
  pull: ["Jalón al Pecho", "Remo en Polea Baja", "Face Pull"],
  legs: ["Prensa de Piernas", "Zancadas Búlgaras", "Elevación de Gemelos"],
  core: ["Plancha con Lastre", "Rueda Abdominal", "Elevación de Piernas"],
};

function formatNumberClean(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

export function GymStrengthSection() {
  const { state, todayKey, logGymSet, deleteGymSet, addGymExercise } = useMob();

  const initialExerciseId = state.gymExercises[0]?.id ?? "";
  const [selectedExerciseId, setSelectedExerciseId] =
    useState<string>(initialExerciseId);

  const [muscleFilter, setMuscleFilter] = useState<"all" | GymMuscleGroup>("all");
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [historyScope, setHistoryScope] = useState<"selected" | "all">("selected");

  // Raw string inputs for smooth mobile decimal/numeric typing without cursor jumps
  const [weightStr, setWeightStr] = useState<string>(() => {
    const { lastSet } = getExerciseBestAndLast(state.gymSets, initialExerciseId);
    return lastSet ? String(lastSet.weightKg) : "20";
  });
  const [repsStr, setRepsStr] = useState<string>(() => {
    const { lastSet } = getExerciseBestAndLast(state.gymSets, initialExerciseId);
    return lastSet ? String(lastSet.reps) : "8";
  });
  const [inputError, setInputError] = useState<string | null>(null);

  // Add custom exercise modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState<GymMuscleGroup>("push");
  const [newExError, setNewExError] = useState<string | null>(null);

  const weightInputId = useId();
  const repsInputId = useId();
  const newExNameId = useId();
  const newExErrorId = useId();
  const loggerFormHeadingId = useId();

  const weightInputRef = useRef<HTMLInputElement>(null);
  const newExInputRef = useRef<HTMLInputElement>(null);

  const selectExerciseWithDefaults = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setInputError(null);
    const { lastSet } = getExerciseBestAndLast(state.gymSets, exerciseId);
    setWeightStr(lastSet ? String(lastSet.weightKg) : "20");
    setRepsStr(lastSet ? String(lastSet.reps) : "8");
  };

  // Filtered exercises based on muscle group or quick pack
  const filteredExercises = useMemo(() => {
    if (activePackId) {
      const pack = GYM_QUICK_PACKS.find((p) => p.id === activePackId);
      if (pack) {
        return state.gymExercises.filter((ex) =>
          pack.exerciseIds.includes(ex.id)
        );
      }
    }
    if (muscleFilter === "all") {
      return state.gymExercises;
    }
    return state.gymExercises.filter((ex) => ex.muscleGroup === muscleFilter);
  }, [state.gymExercises, muscleFilter, activePackId]);

  const selectedExercise: GymExercise | undefined = useMemo(() => {
    return (
      state.gymExercises.find((ex) => ex.id === selectedExerciseId) ??
      filteredExercises[0] ??
      state.gymExercises[0]
    );
  }, [state.gymExercises, filteredExercises, selectedExerciseId]);

  // Pre-compute best & last per exercise for fast 1-second card scanning
  const summariesByExercise = useMemo(() => {
    const map: Record<
      string,
      ReturnType<typeof getExerciseBestAndLast>
    > = {};
    for (const ex of state.gymExercises) {
      map[ex.id] = getExerciseBestAndLast(state.gymSets, ex.id);
    }
    return map;
  }, [state.gymExercises, state.gymSets]);

  const activeSummary = selectedExercise
    ? summariesByExercise[selectedExercise.id] ?? {
        lastSet: undefined,
        best1RmSet: undefined,
        totalSetsCount: 0,
      }
    : { lastSet: undefined, best1RmSet: undefined, totalSetsCount: 0 };

  const exerciseSets = useMemo(() => {
    if (!selectedExercise) return [];
    return state.gymSets.filter((s) => s.exerciseId === selectedExercise.id);
  }, [state.gymSets, selectedExercise]);

  const parsedWeight = useMemo(() => {
    const normalized = weightStr.trim().replace(",", ".");
    const num = Number(normalized);
    return Number.isFinite(num) && num >= 0 ? Number(num.toFixed(2)) : 0;
  }, [weightStr]);

  const parsedReps = useMemo(() => {
    const num = Number(repsStr.trim());
    return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0;
  }, [repsStr]);

  const preview1Rm = useMemo(
    () => calculateEpley1Rm(parsedWeight, parsedReps),
    [parsedWeight, parsedReps]
  );
  const previewVolume = useMemo(
    () => calculateSetVolume(parsedWeight, parsedReps),
    [parsedWeight, parsedReps]
  );
  const willBePr = useMemo(
    () => isNewPersonalRecord(preview1Rm, exerciseSets),
    [preview1Rm, exerciseSets]
  );

  // Recent sets sorted newest first
  const recentSets = useMemo(() => {
    const source =
      historyScope === "selected" && selectedExercise
        ? exerciseSets
        : state.gymSets;

    return [...source]
      .map((entry, idx) => ({ entry, idx }))
      .sort((a, b) => {
        const dateCmp = b.entry.date.localeCompare(a.entry.date);
        if (dateCmp !== 0) return dateCmp;
        const tsCmp = (b.entry.timestamp || "").localeCompare(
          a.entry.timestamp || ""
        );
        if (tsCmp !== 0) return tsCmp;
        return b.idx - a.idx;
      })
      .map((item) => item.entry)
      .slice(0, 12);
  }, [historyScope, selectedExercise, exerciseSets, state.gymSets]);

  const todaySetsCount = useMemo(
    () => state.gymSets.filter((s) => s.date === todayKey).length,
    [state.gymSets, todayKey]
  );

  const adjustWeight = (delta: number) => {
    setInputError(null);
    const next = Math.max(0, Number((parsedWeight + delta).toFixed(2)));
    setWeightStr(String(next));
  };

  const adjustReps = (delta: number) => {
    setInputError(null);
    const base = parsedReps > 0 ? parsedReps : 1;
    const next = Math.max(1, Math.round(base + delta));
    setRepsStr(String(next));
  };

  const handleSelectMuscleFilter = (group: "all" | GymMuscleGroup) => {
    setActivePackId(null);
    setMuscleFilter(group);
    const nextList =
      group === "all"
        ? state.gymExercises
        : state.gymExercises.filter((ex) => ex.muscleGroup === group);
    if (
      nextList.length > 0 &&
      !nextList.some((ex) => ex.id === selectedExercise?.id)
    ) {
      selectExerciseWithDefaults(nextList[0].id);
    }
  };

  const handleToggleQuickPack = (packId: string) => {
    if (activePackId === packId) {
      setActivePackId(null);
      return;
    }
    setMuscleFilter("all");
    setActivePackId(packId);
    const pack = GYM_QUICK_PACKS.find((p) => p.id === packId);
    if (pack) {
      const packExercises = state.gymExercises.filter((ex) =>
        pack.exerciseIds.includes(ex.id)
      );
      if (
        packExercises.length > 0 &&
        !packExercises.some((ex) => ex.id === selectedExercise?.id)
      ) {
        selectExerciseWithDefaults(packExercises[0].id);
      }
    }
  };

  const handleLogCurrentSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;

    if (parsedWeight <= 0 || parsedReps < 1) {
      setInputError("Ingresa un peso mayor a 0 kg y al menos 1 repetición.");
      weightInputRef.current?.focus();
      return;
    }

    setInputError(null);
    logGymSet(selectedExercise.id, parsedWeight, parsedReps, todayKey);
  };

  const handleRepeatLastSet = () => {
    if (!selectedExercise || !activeSummary.lastSet) return;
    const { weightKg, reps } = activeSummary.lastSet;
    setInputError(null);
    setWeightStr(String(weightKg));
    setRepsStr(String(reps));
    logGymSet(selectedExercise.id, weightKg, reps, todayKey);
  };

  const handleProgressiveOverloadLog = () => {
    if (!selectedExercise) return;
    const baseWeight =
      parsedWeight > 0
        ? parsedWeight
        : activeSummary.lastSet?.weightKg ?? 20;
    const nextWeight = Number((baseWeight + 2.5).toFixed(2));
    const nextReps =
      parsedReps >= 1 ? parsedReps : activeSummary.lastSet?.reps ?? 8;

    setInputError(null);
    setWeightStr(String(nextWeight));
    setRepsStr(String(nextReps));
    logGymSet(selectedExercise.id, nextWeight, nextReps, todayKey);
  };

  const openNewExerciseModal = (presetGroup?: GymMuscleGroup) => {
    const defaultGroup =
      presetGroup ?? (muscleFilter !== "all" ? muscleFilter : "push");
    setNewExMuscle(defaultGroup);
    setNewExName("");
    setNewExError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newExName.trim();
    if (trimmed.length < 2) {
      setNewExError("Escribe al menos 2 caracteres para identificar el ejercicio.");
      newExInputRef.current?.focus();
      return;
    }
    const created = addGymExercise(trimmed, newExMuscle);
    setIsAddModalOpen(false);
    setNewExName("");
    setNewExError(null);
    setActivePackId(null);
    if (muscleFilter !== "all" && muscleFilter !== created.muscleGroup) {
      setMuscleFilter(created.muscleGroup);
    }
    selectExerciseWithDefaults(created.id);
  };

  return (
    <div className="space-y-5">
      {/* Top Header + Session Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Registro en 3 segundos · Epley 1RM
          </span>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Fuerza y Cargas Progresivas
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2">
          <Dumbbell
            className="w-4 h-4 text-[var(--accent-sage)]"
            aria-hidden="true"
          />
          <span className="text-xs text-[var(--text-secondary)]">Series hoy:</span>
          <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
            {todaySetsCount}
          </span>
        </div>
      </div>

      {/* Quick Muscle Filter Row + "+ Nuevo ejercicio" CTA */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label="Filtrar ejercicios por grupo muscular"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              aria-pressed={muscleFilter === "all" && !activePackId}
              onClick={() => handleSelectMuscleFilter("all")}
              className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                muscleFilter === "all" && !activePackId
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-canvas)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              Todos
            </button>

            {MUSCLE_ORDER.map((group) => {
              const isActive = muscleFilter === group && !activePackId;
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectMuscleFilter(group)}
                  className={`min-h-10 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? "border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {MUSCLE_GROUP_META[group].label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openNewExerciseModal()}
            className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-action)] hover:text-[var(--accent-action)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nuevo ejercicio</span>
          </button>
        </div>

        {/* Optional Quick Session Packs (zero rigid routine setup required) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] mr-1">
            Packs rápidos:
          </span>
          {GYM_QUICK_PACKS.map((pack) => {
            const active = activePackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleToggleQuickPack(pack.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)] font-semibold"
                    : "border-[var(--border-subtle)] bg-[var(--bg-muted)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {pack.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal / Grid Exercise Selector Cards */}
      {filteredExercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-5 text-center space-y-2.5">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Aún no hay ejercicios registrados en{" "}
            {muscleFilter !== "all"
              ? MUSCLE_GROUP_META[muscleFilter].label
              : "este filtro"}
            .
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Añade el tuyo en 2 toques para empezar a seguir tus marcas.
          </p>
          <button
            type="button"
            onClick={() =>
              openNewExerciseModal(
                muscleFilter !== "all" ? muscleFilter : undefined
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-action)] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Crear ejercicio ahora
          </button>
        </div>
      ) : (
        <div
          role="group"
          aria-label="Seleccionar ejercicio activo"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {filteredExercises.map((ex) => {
            const isSelected = selectedExercise?.id === ex.id;
            const summary = summariesByExercise[ex.id];
            const last = summary?.lastSet;

            return (
              <motion.button
                key={ex.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                aria-pressed={isSelected}
                onClick={() => selectExerciseWithDefaults(ex.id)}
                className={`text-left rounded-2xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-1.5 min-h-20 ${
                  isSelected
                    ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/50 shadow-2xs"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 w-full">
                  <span className="text-xs font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                    {ex.name}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] shrink-0">
                    {MUSCLE_GROUP_META[ex.muscleGroup].label}
                  </span>
                </div>

                <div className="text-[11px] tabular-nums">
                  {last ? (
                    <span className="font-semibold text-[var(--text-secondary)]">
                      Última:{" "}
                      <strong className="text-[var(--text-primary)]">
                        {formatNumberClean(last.weightKg)} kg × {last.reps}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">
                      Sin marca aún
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Panel Táctil de Serie Activa */}
      {selectedExercise && (
        <section
          aria-labelledby={loggerFormHeadingId}
          className="rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-4 sm:p-5 shadow-2xs space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-sage)]">
                  Panel Táctil de Serie Activa
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  · {MUSCLE_GROUP_META[selectedExercise.muscleGroup].label}
                </span>
              </div>
              <h3
                id={loggerFormHeadingId}
                className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {selectedExercise.name}
              </h3>
            </div>

            {/* Historical Reference Metrics */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-3 py-1.5">
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Última serie registrada
                </div>
                <div className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                  {activeSummary.lastSet
                    ? `${formatNumberClean(activeSummary.lastSet.weightKg)} kg × ${
                        activeSummary.lastSet.reps
                      }`
                    : "Sin marca aún"}
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-3 py-1.5">
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Mejor 1RM histórico
                </div>
                <div className="text-sm font-bold tabular-nums text-[var(--medal-gold)]">
                  {activeSummary.best1RmSet
                    ? `${activeSummary.best1RmSet.estimated1RmKg.toFixed(1)} kg`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          <form
            method="POST"
            action="#gym-set-log"
            aria-labelledby={loggerFormHeadingId}
            onSubmit={handleLogCurrentSet}
            className="space-y-4"
            noValidate
          >
            {/* Tactile Weight & Reps Steppers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Weight Control */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-2">
                <label
                  htmlFor={weightInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Peso (kg)
                </label>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => adjustWeight(-2.5)}
                    aria-label="Restar 2.5 kilogramos"
                    className="min-h-12 min-w-14 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-sm font-bold tabular-nums text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    -2.5
                  </motion.button>

                  <input
                    ref={weightInputRef}
                    id={weightInputId}
                    name="weightKg"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    autoComplete="off"
                    value={weightStr}
                    aria-invalid={inputError ? "true" : undefined}
                    onChange={(e) => {
                      setInputError(null);
                      setWeightStr(e.target.value);
                    }}
                    onBlur={() => {
                      if (weightStr.trim() === "" || parsedWeight < 0) {
                        setWeightStr("0");
                      } else {
                        setWeightStr(String(parsedWeight));
                      }
                    }}
                    className="min-h-12 w-full flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-center text-lg font-bold tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-action)] focus:outline-none"
                    style={{ fontSize: "max(1rem, 1.125rem)" }}
                  />

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => adjustWeight(2.5)}
                    aria-label="Sumar 2.5 kilogramos"
                    className="min-h-12 min-w-14 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-sm font-bold tabular-nums text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    +2.5
                  </motion.button>
                </div>
              </div>

              {/* Reps Control */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 space-y-2">
                <label
                  htmlFor={repsInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Repeticiones
                </label>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => adjustReps(-1)}
                    aria-label="Restar 1 repetición"
                    className="min-h-12 min-w-14 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-sm font-bold tabular-nums text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                  >
                    <Minus className="w-3.5 h-3.5" aria-hidden="true" />1
                  </motion.button>

                  <input
                    id={repsInputId}
                    name="reps"
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="done"
                    autoComplete="off"
                    value={repsStr}
                    aria-invalid={inputError ? "true" : undefined}
                    onChange={(e) => {
                      setInputError(null);
                      setRepsStr(e.target.value);
                    }}
                    onBlur={() => {
                      const clean = Math.max(1, parsedReps || 1);
                      setRepsStr(String(clean));
                    }}
                    className="min-h-12 w-full flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-center text-lg font-bold tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-action)] focus:outline-none"
                    style={{ fontSize: "max(1rem, 1.125rem)" }}
                  />

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => adjustReps(1)}
                    aria-label="Sumar 1 repetición"
                    className="min-h-12 min-w-14 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] text-sm font-bold tabular-nums text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />1
                  </motion.button>
                </div>
              </div>
            </div>

            {inputError && (
              <p
                role="alert"
                className="text-xs font-medium text-[var(--accent-action)]"
              >
                {inputError}
              </p>
            )}

            {/* Live Preview Pill + Matte Gold PR Detection Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/65 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                <TrendingUp
                  className="w-4 h-4 text-[var(--accent-sage)] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  1RM est.:{" "}
                  <strong>{preview1Rm.toFixed(1)} kg</strong> · Volumen:{" "}
                  <strong>{formatNumberClean(previewVolume)} kg</strong>
                </span>
              </div>

              <AnimatePresence mode="wait">
                {willBePr && (
                  <motion.span
                    key="pr-live-badge"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-white shadow-2xs"
                    style={{ backgroundColor: "var(--medal-gold)" }}
                  >
                    <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    ¡Supera tu récord actual (Nuevo PR)!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Fast Thumb Action Buttons + Instant Progressive Overload Chip */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeSummary.lastSet && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRepeatLastSet}
                    className="min-h-12 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 tabular-nums"
                  >
                    <RotateCcw
                      className="w-4 h-4 text-[var(--accent-sage)] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Repetir última ({formatNumberClean(activeSummary.lastSet.weightKg)} kg ×{" "}
                      {activeSummary.lastSet.reps})
                    </span>
                  </motion.button>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-95 cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs ${
                    !activeSummary.lastSet ? "sm:col-span-2" : ""
                  }`}
                  style={{
                    backgroundColor: willBePr
                      ? "var(--medal-gold)"
                      : "var(--accent-action)",
                  }}
                >
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Registrar Serie</span>
                </motion.button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  +6 XP Fuerza (+14 XP si es PR) · Inercia positiva sin fricción
                </span>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={handleProgressiveOverloadLog}
                  className="min-h-9 inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-sage)]/50 bg-[var(--accent-sage-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent-sage)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer tabular-nums"
                >
                  <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>+2.5 kg y Registrar</span>
                </motion.button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Recent Sets History */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Series recientes
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Historial rápido con opción de deshacer al instante
            </p>
          </div>

          <div
            role="group"
            aria-label="Alcance de series recientes"
            className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5 text-xs"
          >
            <button
              type="button"
              aria-pressed={historyScope === "selected"}
              onClick={() => setHistoryScope("selected")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                historyScope === "selected"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Este ejercicio ({exerciseSets.length})
            </button>
            <button
              type="button"
              aria-pressed={historyScope === "all"}
              onClick={() => setHistoryScope("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                historyScope === "all"
                  ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Todas ({state.gymSets.length})
            </button>
          </div>
        </div>

        {recentSets.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 text-center text-xs text-[var(--text-secondary)]">
            Aún no hay series registradas aquí. Usa{" "}
            <strong className="text-[var(--text-primary)]">Registrar Serie</strong>{" "}
            arriba para guardar tu primera marca.
          </div>
        ) : (
          <ul role="list" className="space-y-2">
            {recentSets.map((set) => {
              const exObj = state.gymExercises.find(
                (e) => e.id === set.exerciseId
              );
              const exLabel = exObj?.name ?? "Ejercicio";
              const humanDate =
                set.date === todayKey ? "Hoy" : formatHumanDate(set.date);

              return (
                <li
                  key={set.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] capitalize shrink-0">
                      {humanDate}
                    </span>

                    {historyScope === "all" && (
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-44">
                        {exLabel}
                      </span>
                    )}

                    <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                      {formatNumberClean(set.weightKg)} kg × {set.reps}
                    </span>

                    <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                      1RM est. {set.estimated1RmKg.toFixed(1)} kg
                    </span>

                    {set.isPr && (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: "var(--medal-gold)" }}
                      >
                        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                        PR
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteGymSet(set.id)}
                    aria-label={`Eliminar serie de ${exLabel}: ${formatNumberClean(
                      set.weightKg
                    )} kg por ${set.reps} repeticiones (${humanDate})`}
                    className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--accent-action)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 2-Tap Custom Exercise ModalDialog */}
      <ModalDialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nuevo ejercicio de fuerza"
        subtitle="Elige patrón muscular y nombre para registrar series al instante."
      >
        <form
          method="POST"
          action="#add-gym-exercise"
          onSubmit={handleCreateExercise}
          className="space-y-4"
          noValidate
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Grupo muscular
            </legend>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {MUSCLE_ORDER.map((group) => {
                const radioId = `muscle-radio-${group}`;
                const selected = newExMuscle === group;
                return (
                  <div key={group} className="relative">
                    <input
                      type="radio"
                      id={radioId}
                      name="muscleGroup"
                      value={group}
                      checked={selected}
                      onChange={() => setNewExMuscle(group)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={radioId}
                      className={`flex flex-col rounded-xl border p-2.5 cursor-pointer transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--accent-action)] ${
                        selected
                          ? "border-[var(--accent-sage)] bg-[var(--accent-sage-soft)]/50 text-[var(--text-primary)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {MUSCLE_GROUP_META[group].label}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {MUSCLE_GROUP_META[group].shortHint}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label
              htmlFor={newExNameId}
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
            >
              Nombre del ejercicio <span aria-hidden="true">*</span>
            </label>
            <input
              ref={newExInputRef}
              id={newExNameId}
              name="exerciseName"
              type="text"
              required
              enterKeyHint="done"
              value={newExName}
              aria-invalid={newExError ? "true" : undefined}
              aria-describedby={newExError ? newExErrorId : undefined}
              onChange={(e) => {
                setNewExError(null);
                setNewExName(e.target.value);
              }}
              onBlur={() => {
                if (newExName.length > 0 && newExName.trim().length < 2) {
                  setNewExError(
                    "Escribe al menos 2 caracteres para identificar el ejercicio."
                  );
                }
              }}
              placeholder="Ej. Prensa inclinada, Plancha..."
              className="min-h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-action)] focus:outline-none"
              style={{ fontSize: "max(1rem, 1em)" }}
            />
            {newExError && (
              <p
                id={newExErrorId}
                role="alert"
                className="text-xs font-medium text-[var(--accent-action)]"
              >
                {newExError}
              </p>
            )}

            {/* Quick 1-tap preset chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {QUICK_CUSTOM_SUGGESTIONS[newExMuscle].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setNewExError(null);
                    setNewExName(suggestion);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="min-h-11 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-11 px-5 rounded-xl bg-[var(--accent-action)] text-white text-xs font-bold hover:opacity-95 cursor-pointer"
            >
              Guardar y seleccionar
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}

export default GymStrengthSection;
