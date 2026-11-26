"use client";

import React, { useEffect, useState } from "react";
import { Cloud, HardDrive, Monitor, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { useMob } from "@/context/MobContext";

type ColorSchemeChoice = "system" | "light" | "dark";

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, toggleSound, cloudConnected } = useMob();
  const [scheme, setScheme] = useState<ColorSchemeChoice>("system");
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const readStored = () => {
      try {
        const stored = localStorage.getItem("color-scheme");
        if (stored === "light" || stored === "dark") {
          setScheme(stored);
        } else {
          setScheme("system");
        }
      } catch {
        setScheme("system");
      }
    };
    readStored();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener("change", onMqChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-scheme") {
        const nextVal = e.newValue ?? "light dark";
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.setAttribute("content", nextVal);
        readStored();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const applyScheme = (choice: ColorSchemeChoice) => {
    setScheme(choice);
    const metaValue = choice === "system" ? "light dark" : choice;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute("content", metaValue);
    }
    try {
      if (choice === "system") {
        localStorage.removeItem("color-scheme");
      } else {
        localStorage.setItem("color-scheme", choice);
      }
    } catch {
      // ignore storage block
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Ajustes de MOB"
      subtitle="Apariencia, respuesta táctil y estado de sincronización"
    >
      <div className="space-y-5">
        {/* Tri-state Theme Control inside Settings Surface (per modern-web-guidance) */}
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Apariencia
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyScheme("system")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium cursor-pointer transition-colors ${
                scheme === "system"
                  ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/60 text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Sistema</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                ({systemIsDark ? "Oscuro" : "Claro"})
              </span>
            </button>

            <button
              type="button"
              onClick={() => applyScheme("light")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium cursor-pointer transition-colors ${
                scheme === "light"
                  ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/60 text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Papel Cálido</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Claro</span>
            </button>

            <button
              type="button"
              onClick={() => applyScheme("dark")}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium cursor-pointer transition-colors ${
                scheme === "dark"
                  ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/60 text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Carbón Mate</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Oscuro</span>
            </button>
          </div>
        </div>

        {/* Sound & Tactile Feedback */}
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
          <div className="flex items-center gap-3">
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[var(--accent-action)]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Sonidos táctiles y medallas
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-snug mt-0.5">
                Efectos cortos (clics, medallas, campana y secuencia 100%) · No corta tu música externa
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              state.soundEnabled
                ? "bg-[var(--accent-sage)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
            }`}
          >
            {state.soundEnabled ? "Activo" : "Silencio"}
          </button>
        </div>

        {/* Sync Status */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5">
          <div className="flex items-center gap-2.5">
            {cloudConnected ? (
              <Cloud className="w-4 h-4 text-[var(--accent-sage)]" />
            ) : (
              <HardDrive className="w-4 h-4 text-[var(--accent-focus)]" />
            )}
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {cloudConnected
                ? "Sincronización Cloud Supabase activa"
                : "Modo Local-First activo"}
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            {cloudConnected
              ? "Tus datos y toques de Dúo se sincronizan en tiempo real con Supabase."
              : "Tus avances se guardan al instante en este dispositivo y sincronizan entre pestañas. Añade claves en .env.local cuando quieras conectar Supabase Cloud."}
          </p>
        </div>
      </div>
    </ModalDialog>
  );
}
