"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookMarked,
  Radio,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMob } from "@/context/MobContext";
import { ATTRIBUTE_META } from "@/lib/templates";

let activeOverlayInstance: symbol | null = null;

const CLIMB_STEPS: Array<{ pct: number; delayMs: number }> = [
  { pct: 96, delayMs: 0 },
  { pct: 97, delayMs: 190 },
  { pct: 98, delayMs: 380 },
  { pct: 99, delayMs: 580 },
  { pct: 100, delayMs: 820 },
];

export function MobKineticOverlays() {
  const {
    missionStamp,
    dismissMissionStamp,
    activeHundredMoment,
    acknowledgeHundredMoment,
  } = useMob();
  const shouldReduceMotion = useReducedMotion();

  const instanceRef = useRef<symbol | null>(null);
  if (!instanceRef.current) {
    instanceRef.current = Symbol("MobKineticOverlays");
  }
  const [isPrimaryInstance, setIsPrimaryInstance] = useState(true);

  const [displayPct, setDisplayPct] = useState<number>(100);
  const [revealed, setRevealed] = useState<boolean>(false);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    const sym = instanceRef.current!;
    if (activeOverlayInstance === null || activeOverlayInstance === sym) {
      activeOverlayInstance = sym;
      setIsPrimaryInstance(true);
      return () => {
        if (activeOverlayInstance === sym) {
          activeOverlayInstance = null;
        }
      };
    }
    setIsPrimaryInstance(false);
    return undefined;
  }, []);

  // Drive the 96% -> 97% -> 98% -> 99% -> 100% climb (~820ms) when a 100% moment opens
  useEffect(() => {
    if (!activeHundredMoment) {
      return undefined;
    }

    if (shouldReduceMotion) {
      setDisplayPct(100);
      setRevealed(true);
      return undefined;
    }

    setDisplayPct(96);
    setRevealed(false);

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    for (const step of CLIMB_STEPS) {
      if (step.delayMs === 0) continue;
      const t = setTimeout(() => {
        setDisplayPct(step.pct);
        if (step.pct === 100) {
          setRevealed(true);
        }
      }, step.delayMs);
      timers.push(t);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [activeHundredMoment, shouldReduceMotion]);

  // Focus primary CTA once 100% state reveals & support Escape dismissal
  useEffect(() => {
    if (!activeHundredMoment) return undefined;

    if (revealed) {
      const focusTimer = setTimeout(() => {
        continueBtnRef.current?.focus();
      }, 40);
      return () => clearTimeout(focusTimer);
    }
    return undefined;
  }, [activeHundredMoment, revealed]);

  useEffect(() => {
    if (!activeHundredMoment) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        acknowledgeHundredMoment();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeHundredMoment, acknowledgeHundredMoment]);

  if (!isPrimaryInstance) return null;

  const stampAttrMeta =
    missionStamp?.attribute ? ATTRIBUTE_META[missionStamp.attribute] : null;

  return (
    <>
      {/* A) Non-blocking Tactile Stamp (Mission / PR / Duo Op) */}
      <AnimatePresence>
        {missionStamp && !activeHundredMoment && (
          <div
            key={missionStamp.id}
            role="status"
            aria-live="polite"
            className="fixed top-16 lg:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[min(92dvw,27rem)]"
          >
            <motion.button
              type="button"
              onClick={dismissMissionStamp}
              aria-label="Cerrar sello de avance"
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -14, scale: 0.96 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, scale: 0.97 }
              }
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-left rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)]/96 backdrop-blur-md px-4 py-3.5 shadow-xl cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-[var(--accent-action)] shrink-0"
                  />
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent-action)] truncate"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {missionStamp.headline}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {stampAttrMeta && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-muted)] text-[11px] font-semibold text-[var(--text-secondary)]">
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: stampAttrMeta.colorVar }}
                      />
                      +{stampAttrMeta.label}
                    </span>
                  )}
                  <X
                    aria-hidden="true"
                    className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors"
                  />
                </div>
              </div>

              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {missionStamp.itemTitle}
                </p>

                <span
                  className="shrink-0 text-xs font-bold tabular-nums text-[var(--accent-action)] px-2 py-0.5 rounded-lg bg-[var(--accent-action-soft)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  MOB {missionStamp.fromCharge}% → {missionStamp.toCharge}%
                </span>
              </div>

              {/* Tactile Micro-Charge Jump Rail (compositor scaleX) */}
              <div
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden"
              >
                <motion.div
                  className="h-full w-full rounded-full bg-[var(--accent-action)] origin-left"
                  initial={{
                    scaleX: shouldReduceMotion
                      ? Math.max(0.02, missionStamp.toCharge / 100)
                      : Math.max(0.02, missionStamp.fromCharge / 100),
                  }}
                  animate={{
                    scaleX: Math.max(0.02, missionStamp.toCharge / 100),
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* B) Iconic Full-Screen 96% -> 97% -> 98% -> 99% -> 100% Detonation */}
      <AnimatePresence>
        {activeHundredMoment && (
          <motion.div
            key={activeHundredMoment.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-[var(--bg-canvas)]/98 backdrop-blur-md text-[var(--text-primary)] overflow-y-auto flex items-center justify-center p-5 sm:p-8"
          >
            <div className="max-w-lg w-full mx-auto my-auto py-4 text-center">
              {/* Calm Industrial Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                <Sparkles
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-[var(--accent-action)]"
                />
                <span>
                  {revealed ? "Descarga Completa" : "Acumulación Límite"}
                </span>
              </div>

              {/* Giant Kinetic Counter (compositor-only opacity + transform, zero strobe) */}
              <div className="mt-5">
                <motion.div
                  key={shouldReduceMotion ? 100 : displayPct}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0.55, scale: 0.94, y: 6 }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 1,
                          scale: displayPct === 100 ? 1.03 : 1,
                          y: 0,
                        }
                  }
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`text-7xl sm:text-8xl font-bold tracking-tighter tabular-nums leading-none ${
                    displayPct === 100
                      ? "text-[var(--accent-action)]"
                      : "text-[var(--text-primary)]"
                  }`}
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {displayPct}%
                </motion.div>

                {/* Compositor-only Charge Bar */}
                <div
                  aria-hidden="true"
                  className="mt-5 h-2 max-w-xs mx-auto rounded-full bg-[var(--bg-muted)] overflow-hidden"
                >
                  <motion.div
                    className="h-full w-full rounded-full bg-[var(--accent-action)] origin-left"
                    animate={{ scaleX: displayPct / 100 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.16,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>

              {/* Final 100% Revealed Details */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    key="hundred-details"
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 12 }
                    }
                    animate={
                      shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6"
                  >
                    <h1
                      id={dialogTitleId}
                      className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]"
                      style={{ fontFamily: "var(--font-display), sans-serif" }}
                    >
                      {activeHundredMoment.title.toUpperCase()}
                    </h1>

                    <p className="mt-2.5 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                      {activeHundredMoment.subtitle}
                    </p>

                    <div className="mt-3 inline-block rounded-xl bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                      Detonado al completar:{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {activeHundredMoment.triggerAction}
                      </span>
                    </div>

                    {/* 3 Clean Tactile Impact Badges */}
                    <div className="mt-6 space-y-2.5 text-left">
                      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--accent-sage-soft)] text-[var(--accent-sage)] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                          Escudo de Inercia 24h activado
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--accent-action-soft)] text-[var(--accent-action)] flex items-center justify-center shrink-0">
                          <Radio className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                          Onda de impulso enviada a tu Dúo y Crew
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--accent-focus-soft)] text-[var(--accent-focus)] flex items-center justify-center shrink-0">
                          <BookMarked className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                          Registrado en tu Bitácora de Momentos 100%
                        </span>
                      </div>
                    </div>

                    <button
                      ref={continueBtnRef}
                      type="button"
                      onClick={acknowledgeHundredMoment}
                      className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent-action)] text-white px-6 py-3.5 text-sm font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>Continuar desde 0% con nuevo impulso</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
