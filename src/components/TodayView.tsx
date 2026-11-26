"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flag,
  MoonStar,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { AttributeKey, Habit, MedalTier, TaskItem, TimeOfDay } from "@/types/mob";
import { useMob } from "@/context/MobContext";
import {
  ATTRIBUTE_META,
  formatHumanDate,
  TIME_OF_DAY_META,
} from "@/lib/templates";
import { soundEngine } from "@/lib/sound";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { AntiProcrastinationModal } from "@/components/AntiProcrastinationModal";
import { DayDebriefModal } from "@/components/DayDebriefModal";

const TIME_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "anytime"];

const MEDAL_STYLES: Record<
  MedalTier,
  { short: string; name: string; colorVar: string }
> = {
  bronze: { short: "B", name: "Bronce", colorVar: "var(--medal-bronze)" },
  silver: { short: "P", name: "Plata", colorVar: "var(--medal-silver)" },
  gold: { short: "O", name: "Oro", colorVar: "var(--medal-gold)" },
};

export function TodayView({
  onOpenGymTracker,
}: {
  onOpenGymTracker?: () => void;
} = {}) {
  const {
    state,
    todayKey,
    todayFlashEvent,
    shieldActive,
    logHabitTier,
    clearHabitLog,
    addTask,
    toggleTaskComplete,
    toggleMicroStep,
    startMissionSession,
    completeFlashEvent,
    dismissFlashEventToday,
  } = useMob();

  const [quickTitle, setQuickTitle] = useState("");
  const [quickTimeOfDay, setQuickTimeOfDay] = useState<TimeOfDay>("morning");
  const [quickMain, setQuickMain] = useState(false);
  const [quickAttr, setQuickAttr] = useState<AttributeKey>("enfoque");
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [procrastinatingTask, setProcrastinatingTask] = useState<TaskItem | null>(
    null
  );
  const [debriefOpen, setDebriefOpen] = useState(false);

  const alreadyClosedToday = state.closedDayDates.includes(todayKey);

  const todayTasks = state.tasks.filter((t) => t.scheduledDate === todayKey);
  const mainMissions = todayTasks.filter((t) => t.isMainMission);
  const secondaryTasks = todayTasks.filter((t) => !t.isMainMission);
  const todayLogs = state.habitLogs.filter((l) => l.date === todayKey);

  const totalCount = state.habits.length + todayTasks.length;
  const completedCount =
    todayLogs.length + todayTasks.filter((t) => t.completed).length;
  const completionPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle,
      scheduledDate: todayKey,
      timeOfDay: quickTimeOfDay,
      isMainMission: quickMain,
      primaryAttribute: quickAttr,
    });
    setQuickTitle("");
    setQuickMain(false);
    setComposerExpanded(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Scannable Day Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] capitalize">
            {formatHumanDate(todayKey)}
          </span>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Tu Día en un Vistazo
          </h1>
        </div>

        {/* Compact Progress + Consistency Pill (1-second mobile scan without header clutter) */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3.5 py-2">
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[11px] text-[var(--text-secondary)]">
                Avance hoy {completionPct}%
              </div>
              <div className="text-xs font-bold tabular-nums text-[var(--text-primary)]">
                {completedCount}/{totalCount} acciones
              </div>
            </div>
            <div className="w-9 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-action)]"
                animate={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="h-7 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          <div className="flex items-center gap-1.5 tabular-nums">
            <div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Consistencia
              </div>
              <div className="text-xs font-bold text-[var(--accent-sage)] flex items-center gap-1">
                <span>Inercia {state.momentum}%</span>
                {shieldActive && (
                  <ShieldCheck
                    className="w-3.5 h-3.5 text-[var(--accent-sage)] shrink-0"
                    aria-label="Escudo de Inercia activo"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actionable Task/Mission Input ("Menos es más") */}
      <form
        onSubmit={handleQuickAdd}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5 shadow-2xs transition-colors focus-within:border-[var(--border-strong)]"
      >
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={quickTitle}
            onFocus={() => setComposerExpanded(true)}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Añadir tarea o misión para hoy..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none py-1"
          />
          {quickTitle.trim() && (
            <motion.button
              type="submit"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl bg-[var(--accent-action)] text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Sumar
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {composerExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2.5 mt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickMain((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                      quickMain
                        ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                        : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <Flag className="w-3 h-3" />
                    Misión Principal
                  </button>

                  <select
                    aria-label="Momento del día"
                    value={quickTimeOfDay}
                    onChange={(e) => setQuickTimeOfDay(e.target.value as TimeOfDay)}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)]"
                  >
                    {TIME_ORDER.map((t) => (
                      <option key={t} value={t}>
                        {TIME_OF_DAY_META[t].label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Atributo que impulsa"
                    value={quickAttr}
                    onChange={(e) => setQuickAttr(e.target.value as AttributeKey)}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)]"
                  >
                    {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((attr) => (
                      <option key={attr} value={attr}>
                        +{ATTRIBUTE_META[attr].label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setComposerExpanded(false)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Random Open-World Flash Event ("Encuentro Relámpago" anti-stagnation) */}
      <AnimatePresence>
        {todayFlashEvent && (
          <motion.section
            key={todayFlashEvent.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-[var(--accent-action-soft)] text-[var(--accent-action)] flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-action)]">
                    {todayFlashEvent.title}
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--text-tertiary)]">
                    {todayFlashEvent.durationMinutes} min · +{todayFlashEvent.momentumBoost}% Inercia
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] mt-0.5">
                  {todayFlashEvent.actionHint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() =>
                  startMissionSession({
                    type: "flash",
                    itemId: todayFlashEvent.id,
                    title: todayFlashEvent.actionHint,
                    targetMinutes: todayFlashEvent.durationMinutes,
                    attribute: todayFlashEvent.attribute,
                  })
                }
                className="rounded-xl bg-[var(--accent-action)] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer hover:opacity-95"
              >
                Iniciar {todayFlashEvent.durationMinutes}m
              </button>
              <button
                type="button"
                onClick={() => completeFlashEvent(todayFlashEvent)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-sage)] cursor-pointer"
              >
                Hecho
              </button>
              <button
                type="button"
                onClick={dismissFlashEventToday}
                aria-label="Descartar evento relámpago de hoy"
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Missions Section (1 to 3 Top Priorities) */}
      {mainMissions.length > 0 && (
        <section aria-label="Misiones Principales">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Flag className="w-3.5 h-3.5 text-[var(--accent-action)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Misiones Principales ({mainMissions.filter((m) => m.completed).length}/
                {mainMissions.length})
              </h2>
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)]">
              Prioridad de alto impacto
            </span>
          </div>

          <div className="space-y-2.5">
            {mainMissions.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleTaskComplete(task.id)}
                onStart={() =>
                  startMissionSession({
                    type: "task",
                    itemId: task.id,
                    title: task.title,
                    targetMinutes: 20,
                    tierTarget: "gold",
                    attribute: task.primaryAttribute,
                  })
                }
                onPostpone={() => setProcrastinatingTask(task)}
                onToggleMicroStep={(stepId) => toggleMicroStep(task.id, stepId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Scannable Time-of-Day Blocks (Habits + Secondary Tasks unified) */}
      <div className="space-y-6">
        {TIME_ORDER.map((slot) => {
          const slotHabits = state.habits.filter((h) => h.timeOfDay === slot);
          const slotTasks = secondaryTasks.filter((t) => t.timeOfDay === slot);
          if (slotHabits.length === 0 && slotTasks.length === 0) return null;

          return (
            <section key={slot}>
              <div className="flex items-baseline justify-between mb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {TIME_OF_DAY_META[slot].label}
                </h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {TIME_OF_DAY_META[slot].hint}
                </span>
              </div>

              <div className="space-y-2.5">
                {slotHabits.map((habit) => {
                  const log = todayLogs.find((l) => l.habitId === habit.id);
                  return (
                    <HabitRowCard
                      key={habit.id}
                      habit={habit}
                      currentTier={log?.tier}
                      partnerName={state.duo.connected ? state.duo.partnerName : undefined}
                      partnerCompleted={state.duo.partnerCompletedSharedHabitIds.includes(
                        habit.id
                      )}
                      onSelectTier={(tier) => logHabitTier(habit.id, tier)}
                      onClear={() => clearHabitLog(habit.id)}
                      onStartTimer={(tier) =>
                        startMissionSession({
                          type: "habit",
                          itemId: habit.id,
                          title: `${habit.title} · ${habit.tiers[tier].label}`,
                          targetMinutes: habit.tiers[tier].minutes,
                          tierTarget: tier,
                          isCoopDuo: habit.isSharedDuo && state.duo.connected,
                          attribute: habit.primaryAttribute,
                        })
                      }
                      onOpenGymTracker={onOpenGymTracker}
                    />
                  );
                })}

                {slotTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskComplete(task.id)}
                    onStart={() =>
                      startMissionSession({
                        type: "task",
                        itemId: task.id,
                        title: task.title,
                        targetMinutes: 15,
                        tierTarget: "silver",
                        attribute: task.primaryAttribute,
                      })
                    }
                    onPostpone={() => setProcrastinatingTask(task)}
                    onToggleMicroStep={(stepId) => toggleMicroStep(task.id, stepId)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* End-of-Day Tactile Debrief Card */}
      <section
        aria-label="Cierre del Día"
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          alreadyClosedToday
            ? "border-[var(--accent-sage)]/45 bg-[var(--accent-sage-soft)]/30"
            : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              alreadyClosedToday
                ? "bg-[var(--accent-sage)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
            }`}
          >
            {alreadyClosedToday ? (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <MoonStar className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Cierre del Día · Pantalla de resultados y foco de mañana
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {alreadyClosedToday
                ? "Tu jornada de hoy ya quedó consolidada. Puedes revisar tu balance o sumar una prioridad para mañana."
                : "Revisa tus medallas de hoy, suma +4% a tu medidor MOB y deja lista tu Misión Principal #1 de mañana."}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            soundEngine.playTap();
            setDebriefOpen(true);
          }}
          className={`self-end sm:self-center shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
            alreadyClosedToday
              ? "border border-[var(--accent-sage)]/45 bg-[var(--accent-sage-soft)] text-[var(--accent-sage)] hover:opacity-95"
              : "bg-[var(--accent-action)] text-white hover:opacity-95"
          }`}
        >
          {alreadyClosedToday
            ? "Día cerrado ✓ · Ver resumen"
            : "Cerrar el Día (+4% MOB)"}
        </motion.button>
      </section>

      <AntiProcrastinationModal
        task={procrastinatingTask}
        onClose={() => setProcrastinatingTask(null)}
      />

      <DayDebriefModal
        open={debriefOpen}
        onClose={() => setDebriefOpen(false)}
      />
    </div>
  );
}

function HabitRowCard({
  habit,
  currentTier,
  partnerName,
  partnerCompleted,
  onSelectTier,
  onClear,
  onStartTimer,
  onOpenGymTracker,
}: {
  habit: Habit;
  currentTier?: MedalTier;
  partnerName?: string;
  partnerCompleted?: boolean;
  onSelectTier: (tier: MedalTier) => void;
  onClear: () => void;
  onStartTimer: (tier: MedalTier) => void;
  onOpenGymTracker?: () => void;
}) {
  const attrMeta = ATTRIBUTE_META[habit.primaryAttribute];
  const isStrengthHabit =
    habit.primaryAttribute === "fuerza" ||
    habit.secondaryAttribute === "fuerza";
  const nextSuggestedTier: MedalTier = !currentTier
    ? "bronze"
    : currentTier === "bronze"
    ? "silver"
    : "gold";

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-3.5 sm:p-4 transition-colors ${
        currentTier
          ? "border-[var(--accent-sage)]/45 bg-[var(--accent-sage-soft)]/30"
          : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              currentTier
                ? "bg-[var(--accent-sage)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
            }`}
          >
            <HabitIcon name={habit.icon} className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {habit.title}
              </h3>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                +{attrMeta.label}
              </span>
              {habit.isSharedDuo && partnerName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                  <Users className="w-3 h-3 text-[var(--accent-action)]" />
                  Dúo {partnerCompleted ? `· ${partnerName} listo` : `con ${partnerName}`}
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {currentTier ? (
                <span className="font-medium text-[var(--accent-sage)]">
                  Medalla {MEDAL_STYLES[currentTier].name} conseguida ·{" "}
                  {habit.tiers[currentTier].label}
                </span>
              ) : (
                <span>
                  Piso Bronce: {habit.tiers.bronze.label}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Tactile Bronze / Silver / Gold Selector + Play Timer + Gym Shortcut */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 self-end sm:self-center shrink-0">
          {isStrengthHabit && onOpenGymTracker && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onOpenGymTracker}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-sage)] hover:text-[var(--accent-sage)] transition-colors cursor-pointer"
            >
              <Dumbbell
                className="w-3.5 h-3.5 text-[var(--accent-sage)]"
                aria-hidden="true"
              />
              <span>Cargas Gym</span>
            </motion.button>
          )}

          {(["bronze", "silver", "gold"] as MedalTier[]).map((tier) => {
            const active = currentTier === tier;
            const passed =
              (currentTier === "silver" && tier === "bronze") ||
              (currentTier === "gold" && (tier === "bronze" || tier === "silver"));
            const spec = habit.tiers[tier];

            return (
              <motion.button
                key={tier}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => onSelectTier(tier)}
                title={`${MEDAL_STYLES[tier].name}: ${spec.label}`}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold tabular-nums border transition-all cursor-pointer ${
                  active
                    ? "text-white border-transparent shadow-2xs"
                    : passed
                    ? "border-[var(--border-strong)] bg-[var(--bg-muted)] text-[var(--text-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
                style={
                  active
                    ? { backgroundColor: MEDAL_STYLES[tier].colorVar }
                    : undefined
                }
              >
                {MEDAL_STYLES[tier].short} {spec.minutes}m
              </motion.button>
            );
          })}

          {currentTier ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Deshacer registro de hoy"
              title="Deshacer"
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStartTimer(nextSuggestedTier)}
              aria-label={`Iniciar temporizador para ${habit.title}`}
              title="Entrar en Modo Misión"
              className="p-2 rounded-xl bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--accent-action)] hover:text-white transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TaskCard({
  task,
  onToggle,
  onStart,
  onPostpone,
  onToggleMicroStep,
}: {
  task: TaskItem;
  onToggle: () => void;
  onStart: () => void;
  onPostpone: () => void;
  onToggleMicroStep: (stepId: string) => void;
}) {
  const attrMeta = ATTRIBUTE_META[task.primaryAttribute];

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-3.5 sm:p-4 transition-colors ${
        task.completed
          ? "border-[var(--border-subtle)] bg-[var(--bg-muted)]/55 opacity-75"
          : task.isMainMission
          ? "border-[var(--accent-action)]/45 bg-[var(--bg-card)]"
          : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={onToggle}
            aria-label={task.completed ? "Marcar como pendiente" : "Completar tarea"}
            className={`w-6 h-6 mt-0.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              task.completed
                ? "bg-[var(--accent-sage)] border-[var(--accent-sage)] text-white"
                : task.isMainMission
                ? "border-[var(--accent-action)] hover:bg-[var(--accent-action-soft)]"
                : "border-[var(--border-strong)] hover:bg-[var(--bg-muted)]"
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5" />}
          </motion.button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-sm font-semibold leading-snug ${
                  task.completed
                    ? "line-through text-[var(--text-tertiary)]"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {task.title}
              </span>
              {task.optionalTime && (
                <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-[var(--text-secondary)]">
                  <Clock className="w-3 h-3" /> {task.optionalTime}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
              <span>+{attrMeta.label}</span>
              {task.duoSosActive && (
                <span className="inline-flex items-center gap-1 text-[var(--accent-sage)] font-semibold">
                  <Sparkles className="w-3 h-3" /> Co-op Dúo activo
                </span>
              )}
              {task.postponeCount > 0 && !task.completed && (
                <span className="text-[var(--accent-action)] font-medium">
                  Reprogramada {task.postponeCount}x · Prueba Modo 2m
                </span>
              )}
            </div>
          </div>
        </div>

        {!task.completed && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onPostpone}
              className="px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer"
            >
              ¿Aplazar?
            </button>

            <button
              type="button"
              onClick={onStart}
              aria-label={`Entrar en modo misión para ${task.title}`}
              title="Modo En Misión"
              className="p-2 rounded-xl bg-[var(--accent-action-soft)] text-[var(--accent-action)] hover:bg-[var(--accent-action)] hover:text-white transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Progressive Micro-steps checklist (only shown if broken down) */}
      {task.microSteps.length > 0 && !task.completed && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] pl-9 space-y-1.5">
          {task.microSteps.map((ms) => (
            <button
              key={ms.id}
              type="button"
              onClick={() => onToggleMicroStep(ms.id)}
              className="w-full flex items-center gap-2 text-left text-xs py-0.5 cursor-pointer group"
            >
              <span
                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                  ms.done
                    ? "bg-[var(--accent-sage)] border-[var(--accent-sage)] text-white"
                    : "border-[var(--border-strong)] group-hover:border-[var(--accent-action)]"
                }`}
              >
                {ms.done && <Check className="w-2.5 h-2.5" />}
              </span>
              <span
                className={
                  ms.done
                    ? "line-through text-[var(--text-tertiary)]"
                    : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                }
              >
                {ms.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
