"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, Flame, ListTree, Users } from "lucide-react";
import { TaskItem } from "@/types/mob";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useMob } from "@/context/MobContext";
import { getLocalDateKey } from "@/lib/templates";

export function AntiProcrastinationModal({
  task,
  onClose,
}: {
  task: TaskItem | null;
  onClose: () => void;
}) {
  const {
    state,
    startMissionSession,
    applyMicroSteps,
    triggerDuoSosOnTask,
    postponeTaskIntentionally,
  } = useMob();

  const [mode, setMode] = useState<"menu" | "steps" | "reschedule">("menu");
  const [step1, setStep1] = useState("");
  const [step2, setStep2] = useState("");
  const [step3, setStep3] = useState("");

  useEffect(() => {
    if (!task) return;
    setMode("menu");
    setStep1(`Abrir lo necesario para "${task.title.slice(0, 28)}"`);
    setStep2("Hacer el primer avance visible en 5 min");
    setStep3("Dejar cerrado o anotado el siguiente paso");
  }, [task]);

  if (!task) {
    return (
      <ModalDialog open={false} onClose={onClose} title="Desbloquear acción">
        <div />
      </ModalDialog>
    );
  }

  const handleTwoMinuteBronze = () => {
    startMissionSession({
      type: "task",
      itemId: task.id,
      title: `Solo 2 min: ${task.title}`,
      targetMinutes: 2,
      tierTarget: "bronze",
      attribute: task.primaryAttribute,
    });
    onClose();
  };

  const handleSaveSteps = (e: React.FormEvent) => {
    e.preventDefault();
    applyMicroSteps(task.id, [step1, step2, step3]);
    onClose();
  };

  const handleDuoSos = () => {
    triggerDuoSosOnTask(task.id);
    onClose();
  };

  const handleMoveDate = (daysAhead: number) => {
    postponeTaskIntentionally(task.id, getLocalDateKey(daysAhead));
    onClose();
  };

  return (
    <ModalDialog
      open={Boolean(task)}
      onClose={onClose}
      title="¿Cuesta arrancar esta tarea?"
      subtitle={`"${task.title}" · Elige cómo destrabarla sin culpa`}
    >
      {mode === "menu" && (
        <div className="space-y-2.5">
          {/* Option 1: 2-Minute Bronze Rule */}
          <button
            type="button"
            onClick={handleTwoMinuteBronze}
            className="w-full text-left p-3.5 rounded-2xl border border-[var(--accent-action)] bg-[var(--accent-action-soft)]/50 hover:bg-[var(--accent-action-soft)] transition-colors cursor-pointer flex items-start gap-3"
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--accent-action)] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                Modo 2 Minutos (Asegurar Bronce)
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Haz solo 120 segundos ahora mismo. Si luego quieres parar, ya cuenta como victoria.
              </p>
            </div>
          </button>

          {/* Option 2: Break into 3 Micro-steps */}
          <button
            type="button"
            onClick={() => setMode("steps")}
            className="w-full text-left p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)] transition-colors cursor-pointer flex items-start gap-3"
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--accent-focus-soft)] text-[var(--accent-focus)] flex items-center justify-center shrink-0 mt-0.5">
              <ListTree className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Dividir en 3 micro-pasos ridículamente fáciles
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Cuando algo se siente grande, el cerebro lo esquiva. Rómpelo en partes chicas.
              </p>
            </div>
          </button>

          {/* Option 3: SOS Co-op Duo */}
          {state.duo.connected && (
            <button
              type="button"
              onClick={handleDuoSos}
              className="w-full text-left p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-sage)] transition-colors cursor-pointer flex items-start gap-3"
            >
              <span className="w-9 h-9 rounded-xl bg-[var(--accent-sage-soft)] text-[var(--accent-sage)] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Pedir SOS a {state.duo.partnerName} (15 min Co-op)
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Avisa a tu Dúo y activa un bloque compartido de 15 minutos para acompañarte.
                </p>
              </div>
            </button>
          )}

          {/* Option 4: Intentional Reschedule */}
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="w-full text-left p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)] transition-colors cursor-pointer flex items-start gap-3"
          >
            <span className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)] flex items-center justify-center shrink-0 mt-0.5">
              <CalendarClock className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Reprogramar con intención
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Hoy genuinamente no toca. Muévela de fecha protegiendo tu foco actual.
              </p>
            </div>
          </button>
        </div>
      )}

      {mode === "steps" && (
        <form onSubmit={handleSaveSteps} className="space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Edita o confirma estos 3 micro-pasos para verlos directo en tu tarjeta:
          </p>
          <input
            type="text"
            value={step1}
            onChange={(e) => setStep1(e.target.value)}
            placeholder="Paso 1 (ej. Abrir documento)"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={step2}
            onChange={(e) => setStep2(e.target.value)}
            placeholder="Paso 2"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={step3}
            onChange={(e) => setStep3(e.target.value)}
            placeholder="Paso 3"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
          />
          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="text-xs font-medium text-[var(--text-secondary)] px-3 py-2 cursor-pointer"
            >
              Volver
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent-action)] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Guardar micro-pasos
            </button>
          </div>
        </form>
      )}

      {mode === "reschedule" && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            ¿Cuándo tendrás energía real para tomarla?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleMoveDate(1)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] p-3 text-left cursor-pointer"
            >
              <div className="text-sm font-semibold">Mañana</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Fresco a primera hora</div>
            </button>
            <button
              type="button"
              onClick={() => handleMoveDate(2)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] p-3 text-left cursor-pointer"
            >
              <div className="text-sm font-semibold">En 2 días</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Dar margen real</div>
            </button>
            <button
              type="button"
              onClick={() => handleMoveDate(7)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-action)] p-3 text-left cursor-pointer"
            >
              <div className="text-sm font-semibold">Próxima semana</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Sacar del ruido actual</div>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="text-xs font-medium text-[var(--text-secondary)] px-2 py-1 cursor-pointer"
          >
            ← Volver a opciones
          </button>
        </div>
      )}
    </ModalDialog>
  );
}
