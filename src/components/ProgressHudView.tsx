"use client";

import React, { useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Lock,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { AttributeKey, ProgressSubTab } from "@/types/mob";
import { useMob } from "@/context/MobContext";
import { ACHIEVEMENTS_CATALOG, ATTRIBUTE_META } from "@/lib/templates";
import { soundEngine } from "@/lib/sound";
import { GymStrengthSection } from "@/components/GymStrengthSection";
import { BodyMeasurementsSection } from "@/components/BodyMeasurementsSection";
import { EvolutionStatsSection } from "@/components/EvolutionStatsSection";

const PROGRESS_TABS: Array<{
  id: ProgressSubTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "hud", label: "HUD General", icon: Activity },
  { id: "gym", label: "Fuerza / Gym", icon: Dumbbell },
  { id: "body", label: "Cuerpo / Medidas", icon: Ruler },
  { id: "stats", label: "Tablas e Historial", icon: BarChart3 },
];

export function ProgressHudView() {
  const { state, requestedProgressTab, setRequestedProgressTab } = useMob();
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<ProgressSubTab, HTMLButtonElement | null>>>({});

  const activeTab: ProgressSubTab = requestedProgressTab || "hud";

  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    btn?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      ...({ container: "nearest" } as Record<string, string>),
    });
  }, [activeTab]);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = PROGRESS_TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % PROGRESS_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + PROGRESS_TABS.length) % PROGRESS_TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = PROGRESS_TABS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = PROGRESS_TABS[nextIndex];
      soundEngine.playTap();
      setRequestedProgressTab(targetTab.id);
      tabRefs.current[targetTab.id]?.focus();
    }
  };

  const bronzeCount =
    state.habitLogs.filter((l) => l.tier === "bronze").length +
    state.tasks.filter((t) => t.completed && t.completedTier === "bronze").length;
  const silverCount =
    state.habitLogs.filter((l) => l.tier === "silver").length +
    state.tasks.filter((t) => t.completed && t.completedTier === "silver").length;
  const goldCount =
    state.habitLogs.filter((l) => l.tier === "gold").length +
    state.tasks.filter((t) => t.completed && t.completedTier === "gold").length;

  const unlockedCount = Object.keys(state.unlockedAchievementIds).length;
  const overallChecklistPct = Math.min(
    100,
    Math.round(
      state.momentum * 0.45 +
        (unlockedCount / ACHIEVEMENTS_CATALOG.length) * 55
    )
  );

  const activeTabDomId = `${baseId}-tab-${activeTab}`;

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          HUD de Personaje, Fuerza y Evolución
        </span>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Progreso Real
        </h1>
      </div>

      {/* Accessible Single-Row Scrollable Tablist (zero dimension shift on selection) */}
      <div
        role="tablist"
        aria-label="Secciones de progreso"
        onKeyDown={handleTabKeyDown}
        className="mob-tablist gap-1"
      >
        {PROGRESS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const tabDomId = `${baseId}-tab-${tab.id}`;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={tabDomId}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                if (activeTab !== tab.id) {
                  soundEngine.playTap();
                  setRequestedProgressTab(tab.id);
                }
              }}
              className="min-h-11 inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tabpanel — padding/layout strictly on inner child wrapper */}
      <div role="tabpanel" aria-labelledby={activeTabDomId}>
        <div className="pt-1">
          {activeTab === "hud" && (
            <div className="space-y-6">
              {/* GTA-inspired 100% Completion & Momentum Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Inercia Actual (SDT)
                    </span>
                    <TrendingUp className="w-4 h-4 text-[var(--accent-sage)]" />
                  </div>
                  <div
                    className="text-4xl font-bold tabular-nums mt-2 text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {state.momentum}%
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent-sage)]"
                      animate={{ width: `${state.momentum}%` }}
                      transition={{ type: "spring", stiffness: 280, damping: 28 }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                    Reemplaza a las rachas punitivas: si descansas un día no vuelves a cero; cada Bronce recupera impulso.
                  </p>
                </section>

                <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Índice de Dominio MOB
                    </span>
                    <Award className="w-4 h-4 text-[var(--accent-action)]" />
                  </div>
                  <div
                    className="text-4xl font-bold tabular-nums mt-2 text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {overallChecklistPct}%
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center tabular-nums">
                    <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] py-1.5">
                      <div className="text-sm font-bold text-[var(--medal-bronze)]">
                        {bronzeCount}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Bronce
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] py-1.5">
                      <div className="text-sm font-bold text-[var(--medal-silver)]">
                        {silverCount}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Plata
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] py-1.5">
                      <div className="text-sm font-bold text-[var(--medal-gold)]">
                        {goldCount}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        Oro
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* 4 Live Attributes (GTA Stats Evolution) */}
              <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Atributos Vivos
                  </h2>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    100 XP por nivel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((key) => {
                    const meta = ATTRIBUTE_META[key];
                    const xp = state.attributeXp[key];
                    const level = Math.floor(xp / 100) + 1;
                    const pct = xp % 100;

                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4"
                      >
                        <div className="flex items-baseline justify-between">
                          <div>
                            <div className="text-sm font-bold text-[var(--text-primary)]">
                              {meta.label}
                            </div>
                            <div className="text-[11px] text-[var(--text-secondary)]">
                              {meta.shortDesc}
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                            Nv. {level}
                          </span>
                        </div>

                        {/* Segmented GTA-inspired stat bar */}
                        <div className="mt-3 flex gap-1 h-2">
                          {[0, 20, 40, 60, 80].map((threshold) => {
                            const segFill = Math.max(
                              0,
                              Math.min(100, ((pct - threshold) / 20) * 100)
                            );
                            return (
                              <div
                                key={threshold}
                                className="flex-1 rounded-full bg-[var(--bg-muted)] overflow-hidden"
                              >
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: meta.colorVar }}
                                  animate={{ width: `${segFill}%` }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-1.5 text-[11px] text-right tabular-nums text-[var(--text-tertiary)]">
                          {pct}/100 XP siguiente nivel
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Achievements Showcase */}
              <section className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Logros Desbloqueables ({unlockedCount}/{ACHIEVEMENTS_CATALOG.length})
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Diseñados para premiar consistencia real
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ACHIEVEMENTS_CATALOG.map((ach) => {
                    const unlockedAt = state.unlockedAchievementIds[ach.id];
                    const isUnlocked = Boolean(unlockedAt);

                    return (
                      <div
                        key={ach.id}
                        className={`rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                          isUnlocked
                            ? "border-[var(--accent-sage)]/50 bg-[var(--bg-card)]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-card)]/60 opacity-75"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isUnlocked
                              ? "bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                              : "bg-[var(--bg-muted)] text-[var(--text-tertiary)]"
                          }`}
                        >
                          {isUnlocked ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                              {ach.title}
                            </h3>
                            <span
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{
                                color:
                                  ach.tier === "gold"
                                    ? "var(--medal-gold)"
                                    : ach.tier === "silver"
                                    ? "var(--medal-silver)"
                                    : "var(--medal-bronze)",
                              }}
                            >
                              {ach.tier === "gold"
                                ? "Oro"
                                : ach.tier === "silver"
                                ? "Plata"
                                : "Bronce"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                            {ach.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Collapsible Secondary Disclosure for Next Phase Nutrition & Health Connect */}
              <details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                <summary className="font-semibold text-[var(--text-primary)] cursor-pointer flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[var(--accent-action)]" />
                  Siguiente etapa preparada: Nutrición Científica y Google Health Connect
                </summary>
                <p className="mt-2 leading-relaxed">
                  Con Fuerza (Epley 1RM), Antropometría US Navy y Tablas de Evolución ya activos en las pestañas superiores, MOB mantiene listos los adaptadores para{" "}
                  <strong>USDA FoodData Central</strong> +{" "}
                  <strong>Open Food Facts</strong> y la sincronización de pasos/actividad con{" "}
                  <strong>Google Health Connect</strong> vía Capacitor en Android.
                </p>
              </details>
            </div>
          )}

          {activeTab === "gym" && <GymStrengthSection />}
          {activeTab === "body" && <BodyMeasurementsSection />}
          {activeTab === "stats" && <EvolutionStatsSection />}
        </div>
      </div>
    </div>
  );
}
