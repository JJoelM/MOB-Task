"use client";

import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarPlus,
  Check,
  Clock,
  Flag,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { AttributeKey, TimeOfDay } from "@/types/mob";
import { useMob } from "@/context/MobContext";
import {
  ATTRIBUTE_META,
  formatHumanDate,
  getLocalDateKey,
  STARTER_HABIT_TEMPLATES,
  TIME_OF_DAY_META,
} from "@/lib/templates";
import { HabitIcon, ICON_OPTIONS } from "@/components/ui/HabitIcon";
import { ModalDialog } from "@/components/ui/ModalDialog";

export function PlanView() {
  const {
    state,
    todayKey,
    addTask,
    toggleTaskMainMission,
    toggleTaskComplete,
    deleteTask,
    addHabit,
    deleteHabit,
  } = useMob();

  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTimeOfDay, setTaskTimeOfDay] = useState<TimeOfDay>("morning");
  const [taskExactTime, setTaskExactTime] = useState("");
  const [taskAttr, setTaskAttr] = useState<AttributeKey>("enfoque");
  const [taskIsMain, setTaskIsMain] = useState(true);

  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("footprints");
  const [newHabitSlot, setNewHabitSlot] = useState<TimeOfDay>("morning");
  const [newHabitAttr, setNewHabitAttr] = useState<AttributeKey>("energia");
  const [newHabitShared, setNewHabitShared] = useState(false);
  const [bronzeMin, setBronzeMin] = useState(5);
  const [silverMin, setSilverMin] = useState(15);
  const [goldMin, setGoldMin] = useState(30);

  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => {
      const key = getLocalDateKey(idx);
      const [y, m, d] = key.split("-").map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" })
        .format(dateObj)
        .replace(".", "");
      const count = state.tasks.filter(
        (t) => t.scheduledDate === key && !t.completed
      ).length;
      return { key, dayNum: d, weekday, count, isToday: key === todayKey };
    });
  }, [state.tasks, todayKey]);

  const tasksForDay = state.tasks.filter((t) => t.scheduledDate === selectedDate);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask({
      title: taskTitle,
      scheduledDate: selectedDate,
      timeOfDay: taskTimeOfDay,
      optionalTime: taskExactTime || undefined,
      isMainMission: taskIsMain,
      primaryAttribute: taskAttr,
    });
    setTaskTitle("");
    setTaskExactTime("");
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const b = Math.max(1, Number(bronzeMin) || 5);
    const s = Math.max(b + 1, Number(silverMin) || 15);
    const g = Math.max(s + 1, Number(goldMin) || 30);

    addHabit({
      title: newHabitTitle.trim(),
      icon: newHabitIcon,
      timeOfDay: newHabitSlot,
      primaryAttribute: newHabitAttr,
      tiers: {
        bronze: { label: `Piso mínimo (${b} min)`, minutes: b },
        silver: { label: `Ritmo sólido (${s} min)`, minutes: s },
        gold: { label: `Sesión completa (${g} min)`, minutes: g },
      },
      isSharedDuo: newHabitShared,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
    });

    setNewHabitTitle("");
    setHabitModalOpen(false);
  };

  return (
    <div className="space-y-7">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Diseño de Semana y Sistema
        </span>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Planificar sin Rigidez
        </h1>
      </div>

      {/* 7-Day Scannable Strip */}
      <section aria-label="Selector de días">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {next7Days.map((day) => {
            const active = selectedDate === day.key;
            return (
              <motion.button
                key={day.key}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDate(day.key)}
                className={`rounded-2xl border p-2.5 text-center transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-action)] bg-[var(--accent-action)] text-white"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div
                  className={`text-[10px] font-semibold uppercase ${
                    active ? "text-white/85" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {day.isToday ? "Hoy" : day.weekday}
                </div>
                <div className="text-base sm:text-lg font-bold tabular-nums mt-0.5">
                  {day.dayNum}
                </div>
                <div
                  className={`text-[10px] tabular-nums mt-0.5 ${
                    active ? "text-white/90" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {day.count > 0 ? `${day.count} pend.` : "Libre"}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Planner */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold capitalize text-[var(--text-primary)]">
            Misiones para {formatHumanDate(selectedDate)}
          </h2>
          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
            {tasksForDay.length} programadas
          </span>
        </div>

        <form onSubmit={handleCreateTask} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Ej. Preparar entrega, ir al médico, comprar fruta..."
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-action)] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              Agendar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTaskIsMain((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer ${
                taskIsMain
                  ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              Misión Principal
            </button>

            <select
              aria-label="Momento del día"
              value={taskTimeOfDay}
              onChange={(e) => setTaskTimeOfDay(e.target.value as TimeOfDay)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5"
            >
              {(Object.keys(TIME_OF_DAY_META) as TimeOfDay[]).map((slot) => (
                <option key={slot} value={slot}>
                  {TIME_OF_DAY_META[slot].label}
                </option>
              ))}
            </select>

            <select
              aria-label="Atributo"
              value={taskAttr}
              onChange={(e) => setTaskAttr(e.target.value as AttributeKey)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5"
            >
              {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((attr) => (
                <option key={attr} value={attr}>
                  +{ATTRIBUTE_META[attr].label}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5" />
              <input
                type="time"
                aria-label="Hora exacta opcional"
                value={taskExactTime}
                onChange={(e) => setTaskExactTime(e.target.value)}
                className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </label>
          </div>
        </form>

        {/* List of scheduled tasks for selected day */}
        <div className="space-y-2 pt-2">
          {tasksForDay.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-3 text-center">
              Sin tareas puntuales este día. Tus hábitos recurrentes se mantienen activos.
            </p>
          ) : (
            tasksForDay.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(t.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                      t.completed
                        ? "bg-[var(--accent-sage)] border-[var(--accent-sage)] text-white"
                        : "border-[var(--border-strong)]"
                    }`}
                  >
                    {t.completed && <Check className="w-3 h-3" />}
                  </button>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        t.completed ? "line-through text-[var(--text-tertiary)]" : ""
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                      <span>{TIME_OF_DAY_META[t.timeOfDay].label}</span>
                      {t.optionalTime && <span>· {t.optionalTime}</span>}
                      <span>· +{ATTRIBUTE_META[t.primaryAttribute].label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleTaskMainMission(t.id)}
                    title="Alternar Misión Principal"
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      t.isMainMission
                        ? "text-[var(--accent-action)] bg-[var(--accent-action-soft)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(t.id)}
                    aria-label="Eliminar tarea"
                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-action)] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Active Habits Architecture (Bronze / Silver / Gold) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Tus Hábitos Calibrados ({state.habits.length})
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Cada hábito define un piso Bronce para no romper la cadena en días difíciles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHabitModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear hábito
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {state.habits.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] text-[var(--text-primary)] flex items-center justify-center">
                    <HabitIcon name={h.icon} className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{h.title}</span>
                      {h.isSharedDuo && (
                        <Users className="w-3.5 h-3.5 text-[var(--accent-action)]" />
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {TIME_OF_DAY_META[h.timeOfDay].label} · +
                      {ATTRIBUTE_META[h.primaryAttribute].label}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteHabit(h.id)}
                  aria-label={`Eliminar hábito ${h.title}`}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-action)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] tabular-nums">
                <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-2.5 py-1.5">
                  <div className="font-bold text-[var(--medal-bronze)]">Bronce</div>
                  <div className="text-[var(--text-secondary)]">{h.tiers.bronze.minutes} min</div>
                </div>
                <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-2.5 py-1.5">
                  <div className="font-bold text-[var(--medal-silver)]">Plata</div>
                  <div className="text-[var(--text-secondary)]">{h.tiers.silver.minutes} min</div>
                </div>
                <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] px-2.5 py-1.5">
                  <div className="font-bold text-[var(--medal-gold)]">Oro</div>
                  <div className="text-[var(--text-secondary)]">{h.tiers.gold.minutes} min</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* One-tap Quick Add from Remaining Templates */}
        <div className="pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-2">
            Sumar plantilla en 1 toque
          </span>
          <div className="flex flex-wrap gap-2">
            {STARTER_HABIT_TEMPLATES.filter(
              (tpl) => !state.habits.some((h) => h.title === tpl.title)
            ).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() =>
                  addHabit({
                    title: tpl.title,
                    icon: tpl.icon,
                    timeOfDay: tpl.timeOfDay,
                    primaryAttribute: tpl.primaryAttribute,
                    secondaryAttribute: tpl.secondaryAttribute,
                    tiers: tpl.tiers,
                    isSharedDuo: Boolean(tpl.isSharedDuo),
                    activeDays: [0, 1, 2, 3, 4, 5, 6],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-action)] px-3 py-1.5 text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-action)]" />
                {tpl.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Habit Creator Modal */}
      <ModalDialog
        open={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        title="Nuevo hábito por medallas"
        subtitle="Calibra tus escalones Bronce, Plata y Oro en segundos"
      >
        <form onSubmit={handleCreateHabit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Nombre del hábito
            </label>
            <input
              type="text"
              required
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="Ej. Estirar espalda, Practicar inglés, Meditar"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Momento ideal
              </label>
              <select
                value={newHabitSlot}
                onChange={(e) => setNewHabitSlot(e.target.value as TimeOfDay)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                {(Object.keys(TIME_OF_DAY_META) as TimeOfDay[]).map((slot) => (
                  <option key={slot} value={slot}>
                    {TIME_OF_DAY_META[slot].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Atributo principal
              </label>
              <select
                value={newHabitAttr}
                onChange={(e) => setNewHabitAttr(e.target.value as AttributeKey)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((attr) => (
                  <option key={attr} value={attr}>
                    {ATTRIBUTE_META[attr].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Icono
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNewHabitIcon(opt.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                    newHabitIcon === opt.id
                      ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)] font-semibold"
                      : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                  }`}
                >
                  <HabitIcon name={opt.id} className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[var(--medal-bronze)] mb-1">
                Bronce (min)
              </label>
              <input
                type="number"
                min={1}
                value={bronzeMin}
                onChange={(e) => setBronzeMin(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--medal-silver)] mb-1">
                Plata (min)
              </label>
              <input
                type="number"
                min={2}
                value={silverMin}
                onChange={(e) => setSilverMin(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--medal-gold)] mb-1">
                Oro (min)
              </label>
              <input
                type="number"
                min={3}
                value={goldMin}
                onChange={(e) => setGoldMin(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newHabitShared}
              onChange={(e) => setNewHabitShared(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Hábito compartido en Dúo (suma sincronía con {state.duo.partnerName})
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setHabitModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-action)] text-white px-5 py-2 text-xs font-semibold cursor-pointer"
            >
              Guardar hábito
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
