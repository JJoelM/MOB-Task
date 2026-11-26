"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  HeartHandshake,
  Lock,
  Send,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useMob } from "@/context/MobContext";
import { ModalDialog } from "@/components/ui/ModalDialog";

const QUICK_NUDGES = [
  "¡Vamos por el Bronce aunque sea!",
  "¿Hacemos 15 min de foco a la par?",
  "¡Gran ritmo hoy, seguimos sumando!",
  "Yo arranco mi misión ahora, ¿te sumas?",
];

export function BondsView() {
  const {
    state,
    todayKey,
    sendDuoNudge,
    simulatePartnerProgress,
    updatePartnerInfo,
    addCrewFriend,
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
    totalToday === 0 ? 0 : Math.round(((todayLogsCount + todayTasksDone) / totalToday) * 100);

  const synergyBonusUnlocked = myTodayPct >= 50 && state.duo.partnerTodayPct >= 50;

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
              <div className="flex items-center gap-2">
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

        {/* Duo Synergy Banner */}
        <div
          className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
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

          <button
            type="button"
            onClick={simulatePartnerProgress}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-action)] px-2.5 py-1 font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            <Zap className="w-3 h-3 text-[var(--accent-action)]" />
            Simular avance de {state.duo.partnerName}
          </button>
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

      {/* LEVEL 2: CREW (Friends Group Challenge + Privacy by Default) */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-focus)]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Crew · {state.crewName}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[var(--accent-sage)]" />
              Privacidad activa: tus amigos ven tu % y medallas, nunca tus tareas personales.
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
          {state.crewMembers.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5"
            >
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
          ))}
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
