"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Award,
  Check,
  Copy,
  HeartHandshake,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useMob } from "@/context/MobContext";
import { ModalDialog } from "@/components/ui/ModalDialog";
import {
  DUO_OPERATION_TEMPLATES,
  MOB_CHARGE_DELTAS,
} from "@/lib/mob-meter-domain";
import { DuoOperationState } from "@/types/mob";

const QUICK_NUDGES = [
  "¡Vamos por el Bronce aunque sea!",
  "¿Hacemos 15 min de foco a la par?",
  "¡Gran ritmo hoy, seguimos sumando!",
  "Yo arranco mi misión ahora, ¿te sumas?",
];

export function hasSentRespectToday(
  respectSentTodayKeys: string[],
  todayKey: string,
  targetKey: string
): boolean {
  const normalizedTarget = targetKey.startsWith(`${todayKey}:`)
    ? targetKey.slice(todayKey.length + 1)
    : targetKey;
  return respectSentTodayKeys.includes(`${todayKey}:${normalizedTarget}`);
}

export function getRespectButtonLabel(
  sentToday: boolean,
  scope: "duo" | "crew",
  rewardDelta: number = MOB_CHARGE_DELTAS.RESPECT_SALUTE
): string {
  if (scope === "duo") {
    return sentToday
      ? "Respeto enviado hoy ✓"
      : `¡Buen esfuerzo hoy! (+${rewardDelta}% MOB)`;
  }
  return sentToday
    ? "Respeto enviado ✓"
    : `¡Buen esfuerzo! (+${rewardDelta}% MOB)`;
}

export function getDuoOperationProgress(operation: DuoOperationState): {
  completedStages: number;
  totalStages: number;
  pct: number;
  allCompleted: boolean;
  durationLabel: string;
} {
  const totalStages = operation.stages.length;
  const completedStages = operation.stages.filter((s) => s.completed).length;
  const pct =
    totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100);
  const allCompleted = totalStages > 0 && completedStages === totalStages;
  const durationLabel = `${operation.durationDays} ${
    operation.durationDays === 1 ? "día" : "días"
  }`;

  return {
    completedStages,
    totalStages,
    pct,
    allCompleted,
    durationLabel,
  };
}

export function getStageOwnerMeta(
  owner: "me" | "partner",
  partnerName: string
): {
  label: string;
  tone: "terracotta" | "sage";
} {
  if (owner === "me") {
    return { label: "Tú", tone: "terracotta" };
  }
  return {
    label: partnerName.trim() || "Tu Dúo",
    tone: "sage",
  };
}

export function BondsView() {
  const {
    state,
    todayKey,
    sendDuoNudge,
    simulatePartnerProgress,
    updatePartnerInfo,
    addCrewFriend,
    toggleDuoOperationStage,
    switchDuoOperationTemplate,
    sendRespectSalute,
  } = useMob();

  const [copied, setCopied] = useState(false);
  const [editDuoOpen, setEditDuoOpen] = useState(false);
  const [partnerInput, setPartnerInput] = useState(state.duo.partnerName);
  const [friendName, setFriendName] = useState("");

  const todayHabitsCount = state.habits.length;
  const todayLogsCount = state.habitLogs.filter((l) => l.date === todayKey).length;
  const todayTasks = state.tasks.filter((t) => t.scheduledDate === todayKey);
  const todayTasksDone = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayHabitsCount + todayTasks.length;
  const myTodayPct =
    totalToday === 0
      ? 0
      : Math.round(((todayLogsCount + todayTasksDone) / totalToday) * 100);

  const synergyBonusUnlocked =
    myTodayPct >= 50 && state.duo.partnerTodayPct >= 50;

  const duoRespectSent = hasSentRespectToday(
    state.respectSentTodayKeys,
    todayKey,
    "duo"
  );

  const opProgress = getDuoOperationProgress(state.duoOperation);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.duo.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartnerInfo(partnerInput, true);
    setEditDuoOpen(false);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    addCrewFriend(friendName);
    setFriendName("");
  };

  const challengePct = Math.min(
    100,
    Math.round(
      (state.crewChallenge.currentMedals /
        Math.max(1, state.crewChallenge.targetMedals)) *
        100
    )
  );

  return (
    <div className="space-y-7">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Motivación Relacional (SDT)
        </span>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-0.5"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Tu Dúo y tu Crew
        </h1>
      </div>

      {/* LEVEL 1: 1-on-1 DUO (Lucia & Jason Co-op Dynamic) */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[var(--accent-action-soft)] text-[var(--accent-action)] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Dúo con {state.duo.partnerName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-sage-soft)] text-[var(--accent-sage)] tabular-nums">
                  {state.duo.duoSynergyDays} días en sincronía
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Objetivos sincronizados, rescate SOS y bonus cuando ambos avanzan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold tabular-nums cursor-pointer hover:border-[var(--border-strong)]"
            >
              <span>{state.duo.inviteCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPartnerInput(state.duo.partnerName);
                setEditDuoOpen(true);
              }}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 cursor-pointer"
            >
              Configurar
            </button>
          </div>
        </div>

        {/* Side-by-Side Co-op Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Tú ({state.userName || "Jugador"})
              </span>
              <span className="text-xl font-bold tabular-nums">{myTodayPct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-action)]"
                animate={{ width: `${myTodayPct}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-[var(--text-tertiary)] tabular-nums">
              Inercia personal: {state.momentum}%
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {state.duo.partnerName}
              </span>
              <span className="text-xl font-bold tabular-nums">
                {state.duo.partnerTodayPct}%
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-sage)]"
                animate={{ width: `${state.duo.partnerTodayPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] tabular-nums">
              <span>Inercia: {state.duo.partnerMomentum}%</span>
              {state.duo.partnerMainMissionDone && (
                <span className="text-[var(--accent-sage)] font-medium">
                  Misión Principal lista
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Duo Synergy & Camaraderie Respect Bar */}
        <div
          className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            synergyBonusUnlocked
              ? "border-[var(--accent-sage)]/50 bg-[var(--accent-sage-soft)]/50 text-[var(--text-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-action)] shrink-0" />
            <span>
              {synergyBonusUnlocked
                ? "¡Bonus de Sincronía Dúo activo! Ambos superaron el 50% del día."
                : "Meta mutua: si ambos llegan al 50% hoy, desbloquean el Bonus de Sincronía."}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              aria-pressed={duoRespectSent}
              onClick={() => sendRespectSalute("duo", state.duo.partnerName)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold cursor-pointer transition-colors ${
                duoRespectSent
                  ? "border-[var(--accent-sage)]/40 bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                  : "border-[var(--accent-action)]/40 bg-[var(--accent-action-soft)] text-[var(--accent-action)] hover:border-[var(--accent-action)]"
              }`}
            >
              {duoRespectSent ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Award className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{getRespectButtonLabel(duoRespectSent, "duo")}</span>
            </motion.button>

            <button
              type="button"
              onClick={simulatePartnerProgress}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-action)] px-2.5 py-1.5 font-semibold text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              <Zap className="w-3 h-3 text-[var(--accent-action)]" />
              Simular avance de {state.duo.partnerName}
            </button>
          </div>
        </div>

        {/* GTA-Inspired Staged Co-op "Operaciones en Dúo" Card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--accent-action)] shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Operaciones en Dúo
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tabular-nums">
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                {opProgress.completedStages}/{opProgress.totalStages} etapas
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]">
                {state.duoOperation.completedCount}{" "}
                {state.duoOperation.completedCount === 1
                  ? "operación cerrada"
                  : "operaciones cerradas"}
              </span>
            </div>
          </div>

          {/* Compact Template Selector Pills */}
          <div
            role="group"
            aria-label="Seleccionar plantilla de Operación en Dúo"
            className="flex flex-wrap gap-1.5"
          >
            {DUO_OPERATION_TEMPLATES.map((tpl) => {
              const isSelected = tpl.id === state.duoOperation.templateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (!isSelected) {
                      switchDuoOperationTemplate(tpl.id);
                    }
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {tpl.title}
                </button>
              );
            })}
          </div>

          {/* Active Operation Summary & Progress */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {state.duoOperation.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tabular-nums">
                <span className="px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]">
                  {opProgress.durationLabel}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--accent-action-soft)] text-[var(--accent-action)]">
                  +{state.duoOperation.rewardMobCharge}% MOB al cerrar
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {state.duoOperation.subtitle}
            </p>

            <div className="h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-action)]"
                animate={{ width: `${opProgress.pct}%` }}
              />
            </div>
          </div>

          {/* Scannable Co-op Stages */}
          <div className="space-y-2">
            {state.duoOperation.stages.map((stage, index) => {
              const ownerMeta = getStageOwnerMeta(
                stage.owner,
                state.duo.partnerName
              );
              const ownerBadgeClass =
                ownerMeta.tone === "terracotta"
                  ? "bg-[var(--accent-action-soft)] text-[var(--accent-action)]"
                  : "bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]";

              return (
                <motion.button
                  key={stage.id}
                  type="button"
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={stage.completed}
                  onClick={() => toggleDuoOperationStage(stage.id)}
                  className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    stage.completed
                      ? "border-[var(--accent-sage)]/45 bg-[var(--accent-sage-soft)]/35"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      stage.completed
                        ? "border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white"
                        : "border-[var(--border-strong)] bg-[var(--bg-canvas)] text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-[var(--text-tertiary)] tabular-nums">
                          0{index + 1}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            stage.completed
                              ? "text-[var(--text-secondary)] line-through"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {stage.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ownerBadgeClass}`}
                        >
                          {ownerMeta.label}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          stage.completed
                            ? "text-[var(--accent-sage)]"
                            : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {stage.completed
                          ? "Lista ✓"
                          : `+${MOB_CHARGE_DELTAS.DUO_STAGE}% MOB`}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {stage.hint}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {opProgress.allCompleted && (
            <div className="rounded-xl border border-[var(--accent-sage)]/45 bg-[var(--accent-sage-soft)]/50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[var(--accent-sage)]">
                ¡Operación completada en equipo! +{state.duoOperation.rewardMobCharge}% MOB al cierre acreditado.
              </span>
              <button
                type="button"
                onClick={() =>
                  switchDuoOperationTemplate(state.duoOperation.templateId)
                }
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-action)] px-2.5 py-1 font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-[var(--accent-action)]" />
                Nueva ronda
              </button>
            </div>
          )}
        </div>

        {/* One-Tap Quick Nudges */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-2">
            Enviar toque en 1 clic (cero chat interminable)
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_NUDGES.map((msg) => (
              <motion.button
                key={msg}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => sendDuoNudge(msg)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <Send className="w-3 h-3 text-[var(--accent-action)]" />
                {msg}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Pulses Feed */}
        {state.duo.nudges.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {state.duo.nudges.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="text-xs rounded-xl bg-[var(--bg-canvas)] px-3 py-2 flex items-center justify-between gap-2"
              >
                <span>
                  <strong className="font-semibold">
                    {n.from === "me" ? "Tú" : state.duo.partnerName}:
                  </strong>{" "}
                  <span className="text-[var(--text-secondary)]">{n.label}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LEVEL 2: CREW (Body Improvement Club Spirit + Privacy by Default) */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-focus)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Crew · {state.crewName}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-focus-soft)] text-[var(--accent-focus)]">
                Espíritu Club de Mejora
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)]">
              Aquí se respeta cada gota de esfuerzo — incluso sostener el Bronce en un día pesado.
            </p>
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[var(--accent-sage)] shrink-0" />
              <span>
                Privacidad activa: tus amigos ven tu % y medallas, nunca tus tareas personales ni tus métricas corporales.
              </span>
            </p>
          </div>
        </div>

        {/* Weekly Cooperative Crew Challenge */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-focus)]">
                Reto Semanal Cooperativo
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                {state.crewChallenge.title}
              </div>
            </div>
            <span className="text-sm font-bold tabular-nums">
              {state.crewChallenge.currentMedals}/{state.crewChallenge.targetMedals} medallas
            </span>
          </div>

          <div className="mt-2.5 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent-focus)]"
              animate={{ width: `${challengePct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {state.crewChallenge.subtitle} · Quedan {state.crewChallenge.daysRemaining} días.
          </p>
        </div>

        {/* Crew Members Scannable Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {state.crewMembers.map((m) => {
            const memberRespectSent = hasSentRespectToday(
              state.respectSentTodayKeys,
              todayKey,
              m.id
            );

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-[var(--bg-muted)] text-xs font-bold flex items-center justify-center">
                        {m.initials}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] tabular-nums">
                          Inercia {m.momentum}%
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-[var(--accent-sage)]">
                      {m.todayPct}%
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2.5 truncate">
                    {m.statusLabel}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums text-[var(--text-secondary)]">
                    <span className="text-[var(--medal-bronze)] font-semibold">
                      B·{m.medalsThisWeek.bronze}
                    </span>
                    <span className="text-[var(--medal-silver)] font-semibold">
                      P·{m.medalsThisWeek.silver}
                    </span>
                    <span className="text-[var(--medal-gold)] font-semibold">
                      O·{m.medalsThisWeek.gold}
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={memberRespectSent}
                  onClick={() => sendRespectSalute(m.id, m.name)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                    memberRespectSent
                      ? "border-[var(--accent-sage)]/40 bg-[var(--accent-sage-soft)] text-[var(--accent-sage)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent-action)] hover:text-[var(--accent-action)]"
                  }`}
                >
                  {memberRespectSent ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Award className="w-3.5 h-3.5 text-[var(--accent-action)] shrink-0" />
                  )}
                  <span>{getRespectButtonLabel(memberRespectSent, "crew")}</span>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* Quick Invite Friend to Crew */}
        <form onSubmit={handleAddFriend} className="flex gap-2">
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Sumar amigo a la Crew (ej. Valen)..."
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs text-[var(--text-primary)]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[var(--accent-action)]" />
            Invitar
          </button>
        </form>
      </section>

      <ModalDialog
        open={editDuoOpen}
        onClose={() => setEditDuoOpen(false)}
        title="Configurar Vínculo Dúo"
        subtitle="Personaliza el nombre de tu pareja o compañero principal"
      >
        <form onSubmit={handleSavePartner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Nombre de tu compañero/a Dúo
            </label>
            <input
              type="text"
              value={partnerInput}
              onChange={(e) => setPartnerInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditDuoOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-action)] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Guardar vínculo
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
