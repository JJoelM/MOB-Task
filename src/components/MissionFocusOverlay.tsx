"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Headphones, Pause, Play, Users, X } from "lucide-react";
import { useMob } from "@/context/MobContext";
import { ATTRIBUTE_META } from "@/lib/templates";
import { soundEngine } from "@/lib/sound";

export function MissionFocusOverlay() {
  const { activeMission, state, finishMissionSession, cancelMissionSession } = useMob();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);

  const totalSeconds = (activeMission?.targetMinutes ?? 5) * 60;

  useEffect(() => {
    if (!activeMission) {
      setAmbientOn(false);
      return;
    }
    setSecondsLeft(activeMission.targetMinutes * 60);
    setPaused(false);
  }, [activeMission]);

  useEffect(() => {
    if (!activeMission || paused) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeMission, paused]);

  const toggleAmbient = () => {
    const next = !ambientOn;
    setAmbientOn(next);
    soundEngine.toggleAmbientFocus(next);
  };

  if (!activeMission) return null;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const elapsedPct = Math.min(
    100,
    Math.round(((totalSeconds - secondsLeft) / Math.max(1, totalSeconds)) * 100)
  );
  const attrMeta = ATTRIBUTE_META[activeMission.attribute];

  return (
    <AnimatePresence>
      <motion.div
        key="mission-overlay"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between p-6 sm:p-10"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between max-w-2xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: attrMeta.colorVar }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              En Misión · +{attrMeta.label}
            </span>
            {activeMission.isCoopDuo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-action-soft)] text-[var(--accent-action)]">
                <Users className="w-3 h-3" /> Co-op con {state.duo.partnerName}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={cancelMissionSession}
            aria-label="Salir del modo misión"
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Focus Area */}
        <div className="max-w-xl w-full mx-auto text-center my-auto py-8">
          {activeMission.tierTarget && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] mb-4">
              Objetivo{" "}
              {activeMission.tierTarget === "bronze"
                ? "Bronce"
                : activeMission.tierTarget === "silver"
                ? "Plata"
                : "Oro"}
            </span>
          )}

          <h1
            className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {activeMission.title}
          </h1>

          <div
            className="mt-8 text-6xl sm:text-8xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {mins}:{secs}
          </div>

          {/* Live Progress Bar */}
          <div className="mt-8 h-2.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent-action)]"
              animate={{ width: `${elapsedPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="mt-2.5 text-xs text-[var(--text-secondary)] tabular-nums">
            {secondsLeft === 0
              ? "¡Tiempo cumplido! Marca la misión cuando quieras."
              : `${elapsedPct}% completado · Cero multitarea`}
          </p>
        </div>

        {/* Bottom Tactile Controls */}
        <div className="max-w-xl w-full mx-auto flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {paused ? "Reanudar" : "Pausar"}
          </button>

          <button
            type="button"
            onClick={toggleAmbient}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold cursor-pointer transition-colors ${
              ambientOn
                ? "border-[var(--accent-focus)] bg-[var(--accent-focus-soft)] text-[var(--accent-focus)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
          >
            <Headphones className="w-4 h-4" />
            {ambientOn ? "Audio Foco Activo" : "Sonido Ambiental"}
          </button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={finishMissionSession}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-sage)] text-white px-6 py-3 text-sm font-semibold cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            Completar ahora
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
