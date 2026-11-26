"use client";

import React, { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import {
  Award,
  CheckCircle2,
  Dumbbell,
  Flag,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useMob } from "@/context/MobContext";
import { formatHumanDate } from "@/lib/templates";

export function DayDebriefModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, todayKey, shieldActive, completeDayDebrief } = useMob();
  const [tomorrowMission, setTomorrowMission] = useState("");
  const inputId = useId();

  useEffect(() => {
    if (open) {
      setTomorrowMission("");
    }
  }, [open]);

  const alreadyClosedToday = state.closedDayDates.includes(todayKey);

  const todayLogs = state.habitLogs.filter((l) => l.date === todayKey);
  const todayTasks = state.tasks.filter((t) => t.scheduledDate === todayKey);
  const completedTasksCount = todayTasks.filter((t) => t.completed).length;
  const totalTasks = todayTasks.length;

  const todayBronze =
    todayLogs.filter((l) => l.tier === "bronze").length +
    todayTasks.filter((t) => t.completed && t.completedTier === "bronze").length;
  const todaySilver =
    todayLogs.filter((l) => l.tier === "silver").length +
    todayTasks.filter((t) => t.completed && t.completedTier === "silver").length;
  const todayGold =
    todayLogs.filter((l) => l.tier === "gold").length +
    todayTasks.filter((t) => t.completed && t.completedTier === "gold").length;

  const todayGymSets = state.gymSets.filter((s) => s.date === todayKey);
  const todayGymPrs = todayGymSets.filter((s) => s.isPr).length;

  const distanceToHundred = Math.max(1, 100 - state.mobCharge);

  // Warm SDT feedback message honoring Club de Mejora (even 1 Bronze = real win)
  const mainMissionDoneToday = todayTasks.some(
    (t) => t.isMainMission && t.completed
  );
  let sdtHeadline = "Cierre consciente y mente despejada";
  let sdtBody =
    "Hacer pausa y ordenar el foco de mañana ya protege tu ritmo. Descansa sin culpa.";

  if (todayGold > 0 || mainMissionDoneToday || todayGymPrs > 0) {
    sdtHeadline = "Jornada de alto impacto cumplida";
    sdtBody =
      "Cerraste prioridades clave con foco limpio. Tu esfuerzo de hoy empuja directo tu próximo 100%.";
  } else if (
    todaySilver > 0 ||
    completedTasksCount > 0 ||
    todayGymSets.length >= 2
  ) {
    sdtHeadline = "Trabajo constante que nunca traiciona";
    sdtBody =
      "Sostuviste un ritmo firme sin caer en el todo-o-nada. Cada bloque sumado consolida tu disciplina.";
  } else if (todayBronze > 0 || todayGymSets.length > 0) {
    sdtHeadline = "Club de Mejora · Piso mínimo protegido";
    sdtBody =
      "Aseguraste el piso mínimo: cero días perdidos. En días exigentes, un solo paso real vale oro.";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeDayDebrief(tomorrowMission);
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Resumen de Cierre del Día"
      subtitle={`${formatHumanDate(todayKey)} · Balance táctil y foco de mañana`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rockstar Mission-Debrief Medals Breakdown */}
        <section
          aria-label="Medallas obtenidas hoy"
          className="grid grid-cols-3 gap-2.5 text-center tabular-nums"
        >
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5">
            <div
              className="text-xl font-bold"
              style={{
                color: "var(--medal-bronze)",
                fontFamily: "var(--font-display), sans-serif",
              }}
            >
              {todayBronze}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
              Bronce
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5">
            <div
              className="text-xl font-bold"
              style={{
                color: "var(--medal-silver)",
                fontFamily: "var(--font-display), sans-serif",
              }}
            >
              {todaySilver}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
              Plata
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2.5">
            <div
              className="text-xl font-bold"
              style={{
                color: "var(--medal-gold)",
                fontFamily: "var(--font-display), sans-serif",
              }}
            >
              {todayGold}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
              Oro
            </div>
          </div>
        </section>

        {/* Key Operational Metrics Row: Tasks, Gym Sets, Momentum */}
        <section className="grid grid-cols-3 gap-2 tabular-nums">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/55 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              <CheckCircle2
                className="w-3.5 h-3.5 text-[var(--accent-action)] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Tareas hoy</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-1">
              {completedTasksCount} / {totalTasks}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/55 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              <Dumbbell
                className="w-3.5 h-3.5 text-[var(--accent-sage)] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Series Gym</span>
            </div>
            <div className="text-base font-bold text-[var(--text-primary)] mt-1">
              {todayGymSets.length}
              {todayGymPrs > 0 && (
                <span className="ml-1 text-[11px] font-semibold text-[var(--medal-gold)]">
                  ({todayGymPrs} PR)
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/55 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
              <TrendingUp
                className="w-3.5 h-3.5 text-[var(--accent-sage)] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">Inercia</span>
            </div>
            <div className="text-base font-bold text-[var(--accent-sage)] mt-1 flex items-center gap-1">
              <span>{state.momentum}%</span>
              {shieldActive && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-[var(--accent-sage)] shrink-0"
                  aria-label="Escudo activo"
                />
              )}
            </div>
          </div>
        </section>

        {/* MOB 0% -> 100% Distance Readout */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
          <div className="flex items-baseline justify-between gap-2 tabular-nums">
            <span
              className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              <Award
                className="w-4 h-4 text-[var(--accent-action)] shrink-0"
                aria-hidden="true"
              />
              <span>MOB {state.mobCharge}%</span>
            </span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Inercia estable: {state.momentum}%
            </span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent-action)]"
              initial={false}
              animate={{ width: `${state.mobCharge}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            />
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-2 tabular-nums">
            Faltan{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              {distanceToHundred}%
            </strong>{" "}
            para tu próximo 100%
            {!alreadyClosedToday && (
              <span className="text-[var(--accent-action)] font-semibold">
                {" "}
                · Cerrar hoy suma +4%
              </span>
            )}
          </p>
        </section>

        {/* Warm SDT Club de Mejora Feedback */}
        <section className="rounded-2xl border border-[var(--accent-sage)]/35 bg-[var(--accent-sage-soft)]/45 p-3.5 flex items-start gap-3">
          <span className="w-8 h-8 rounded-xl bg-[var(--accent-sage)] text-white flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </span>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">
              {sdtHeadline}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              {sdtBody}
            </p>
          </div>
        </section>

        {/* Optional 1-line Tomorrow Main Mission #1 */}
        <div>
          <label
            htmlFor={inputId}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] mb-1.5"
          >
            <Flag
              className="w-3.5 h-3.5 text-[var(--accent-action)] shrink-0"
              aria-hidden="true"
            />
            <span>Dejar lista mi Misión Principal #1 para mañana (opcional)</span>
          </label>
          <input
            id={inputId}
            type="text"
            value={tomorrowMission}
            onChange={(e) => setTomorrowMission(e.target.value)}
            placeholder="Ej. Entregar propuesta clave antes de las 11:00..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-action)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-95 cursor-pointer ${
              alreadyClosedToday
                ? "bg-[var(--accent-sage)]"
                : "bg-[var(--accent-action)]"
            }`}
          >
            {!alreadyClosedToday ? "Consolidar Día (+4% MOB)" : "Guardar y cerrar"}
          </motion.button>
        </div>
      </form>
    </ModalDialog>
  );
}
