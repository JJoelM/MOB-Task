"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CalendarRange,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { NavSection } from "@/types/mob";
import { useMob } from "@/context/MobContext";
import { ATTRIBUTE_META } from "@/lib/templates";
import { SettingsDialog } from "@/components/SettingsDialog";
import { soundEngine } from "@/lib/sound";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "today", label: "Hoy", icon: CheckCircle2 },
  { id: "plan", label: "Planificar", icon: CalendarRange },
  { id: "progress", label: "Progreso", icon: Activity },
  { id: "bonds", label: "Vínculos", icon: Users },
];

export function AppShell({
  activeNav,
  onSelectNav,
  children,
}: {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  children: React.ReactNode;
}) {
  const { state, todayKey, toasts, dismissToast, sendDuoNudge } = useMob();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightHudOpen, setRightHudOpen] = useState(true);

  const todayHabitsCount = state.habits.length;
  const todayHabitLogsCount = state.habitLogs.filter((l) => l.date === todayKey).length;
  const todayTasks = state.tasks.filter((t) => t.scheduledDate === todayKey);
  const todayTasksDone = todayTasks.filter((t) => t.completed).length;
  const totalTodayItems = todayHabitsCount + todayTasks.length;
  const myTodayPct =
    totalTodayItems === 0
      ? 0
      : Math.round(((todayHabitLogsCount + todayTasksDone) / totalTodayItems) * 100);

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-5 sticky top-0 h-dvh">
        <div>
          <div className="flex items-center justify-between px-2 mb-7">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-bold text-sm">
                M
              </div>
              <div>
                <span
                  className="font-bold text-base tracking-tight block leading-none"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  MOB
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Hola, {state.userName || "Jugador"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Abrir ajustes"
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <Settings2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Navegación principal" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    soundEngine.playTap();
                    onSelectNav(item.id);
                  }}
                  className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "text-[var(--text-primary)] bg-[var(--bg-muted)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-nav-indicator"
                      className="w-1 h-5 rounded-full bg-[var(--accent-action)] absolute left-1"
                      transition={{ type: "spring", stiffness: 450, damping: 34 }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[var(--accent-action)]" : ""
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.id === "bonds" && state.duo.connected && (
                    <span className="ml-auto text-[11px] tabular-nums px-1.5 py-0.5 rounded-md bg-[var(--accent-sage-soft)] text-[var(--accent-sage)] font-semibold">
                      {state.duo.partnerTodayPct}%
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Compact Momentum Pill at Sidebar Bottom */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--text-secondary)]">Inercia</span>
            <span className="font-bold tabular-nums text-[var(--accent-sage)]">
              {state.momentum}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent-sage)]"
              initial={false}
              animate={{ width: `${state.momentum}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
            No cae a cero: cada Bronce suma impulso.
          </p>
        </div>
      </aside>

      {/* Mobile Compact Header (<10% dvh, single row per modern-web-guidance) */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/92 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-bold text-xs">
            M
          </div>
          <span
            className="font-bold text-base tracking-tight"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            MOB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectNav("progress")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-semibold tabular-nums cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-sage)]" />
            <span>Inercia {state.momentum}%</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ajustes"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card)] cursor-pointer"
          >
            <Settings2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area + Desktop Collapsible Right HUD Panel */}
      <div className="flex-1 flex min-w-0">
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:py-7 max-w-3xl mx-auto w-full">
          <div className="hidden lg:flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setRightHudOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              {rightHudOpen ? (
                <>
                  <PanelRightClose className="w-3.5 h-3.5" /> Ocultar panel lateral
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" /> Mostrar HUD y Dúo
                </>
              )}
            </button>
          </div>
          {children}
        </main>

        {/* Collapsible Right Live HUD on PC (2-Panel Desktop Experience) */}
        {rightHudOpen && (
          <aside className="hidden xl:flex xl:w-80 xl:shrink-0 xl:flex-col gap-4 border-l border-[var(--border-subtle)] bg-[var(--bg-card)]/65 p-5 sticky top-0 h-dvh overflow-y-auto">
            {/* Today Completion Ring/Bar */}
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Pulso de Hoy
                </span>
                <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                  {myTodayPct}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-action)]"
                  animate={{ width: `${myTodayPct}%` }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              </div>
              <div className="mt-2 text-xs text-[var(--text-secondary)] tabular-nums">
                {todayHabitLogsCount}/{todayHabitsCount} hábitos · {todayTasksDone}/
                {todayTasks.length} tareas
              </div>
            </section>

            {/* Live Duo Sync Card (Lucia & Jason Sync) */}
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-sage)]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Dúo · {state.duo.partnerName}
                  </span>
                </div>
                <span className="text-xs font-bold tabular-nums text-[var(--accent-sage)]">
                  {state.duo.duoSynergyDays}d sincronía
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div className="rounded-xl bg-[var(--bg-canvas)] p-2.5 border border-[var(--border-subtle)]">
                  <div className="text-[var(--text-tertiary)]">Tú hoy</div>
                  <div className="text-base font-bold mt-0.5">{myTodayPct}%</div>
                </div>
                <div className="rounded-xl bg-[var(--bg-canvas)] p-2.5 border border-[var(--border-subtle)]">
                  <div className="text-[var(--text-tertiary)]">
                    {state.duo.partnerName}
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    {state.duo.partnerTodayPct}%
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => sendDuoNudge("¡Te mando impulso para cerrar el día!")}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[var(--accent-action)]" />
                Enviar toque rápido
              </button>
            </section>

            {/* Mini Live Attributes HUD */}
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-3">
                Atributos Vivos
              </span>
              <div className="space-y-2.5">
                {(Object.keys(ATTRIBUTE_META) as Array<keyof typeof ATTRIBUTE_META>).map(
                  (key) => {
                    const xp = state.attributeXp[key];
                    const level = Math.floor(xp / 100) + 1;
                    const pct = xp % 100;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1 tabular-nums">
                          <span className="font-medium text-[var(--text-primary)]">
                            {ATTRIBUTE_META[key].label}
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            Nv.{level} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: ATTRIBUTE_META[key].colorVar }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </aside>
        )}
      </div>

      {/* Mobile Bottom Tab Bar (<11% dvh, thumb-reachable) */}
      <nav
        aria-label="Navegación móvil"
        className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-md px-2 py-1.5"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  soundEngine.playTap();
                  onSelectNav(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "text-[var(--accent-action)] font-semibold"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-x-3 top-0.5 h-0.5 rounded-full bg-[var(--accent-action)]"
                    transition={{ type: "spring", stiffness: 460, damping: 34 }}
                  />
                )}
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Non-blocking Tactile Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 flex flex-col gap-2 max-w-xs w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="pointer-events-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 shadow-lg flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        t.tone === "gold"
                          ? "var(--medal-gold)"
                          : t.tone === "action"
                          ? "var(--accent-action)"
                          : "var(--accent-sage)",
                    }}
                  />
                  {t.title}
                </div>
                {t.subtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                    {t.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Cerrar notificación"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
