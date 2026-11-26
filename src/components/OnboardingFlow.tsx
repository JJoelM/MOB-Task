"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Copy, Users } from "lucide-react";
import { useMob } from "@/context/MobContext";
import { ATTRIBUTE_META, STARTER_HABIT_TEMPLATES } from "@/lib/templates";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { soundEngine } from "@/lib/sound";

export function OnboardingFlow() {
  const { state, completeOnboarding } = useMob();
  const [step, setStep] = useState<1 | 2>(1);
  const [userName, setUserName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "tpl-walk",
    "tpl-deepwork",
    "tpl-duo-walk",
  ]);
  const [partnerName, setPartnerName] = useState("Lucía");
  const [firstMission, setFirstMission] = useState(
    "Avanzar 20 min en lo que vengo postergando"
  );
  const [copied, setCopied] = useState(false);

  const toggleTemplate = (id: string) => {
    soundEngine.playTap();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyCode = async () => {
    soundEngine.playTap();
    try {
      await navigator.clipboard.writeText(state.duo.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback ignored
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
      userName,
      selectedTemplateIds: selectedIds,
      partnerName,
      customFirstMission: firstMission,
    });
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-8 bg-[var(--bg-canvas)]">
      <div className="w-full max-w-xl">
        {/* Brand Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] flex items-center justify-center font-bold tracking-tight">
              M
            </div>
            <div>
              <span
                className="text-lg font-bold tracking-tight block leading-none"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                MOB
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Menos ruido. Más impulso.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] tabular-nums">
            <span
              className={`w-6 h-1.5 rounded-full transition-colors ${
                step >= 1 ? "bg-[var(--accent-action)]" : "bg-[var(--border-subtle)]"
              }`}
            />
            <span
              className={`w-6 h-1.5 rounded-full transition-colors ${
                step >= 2 ? "bg-[var(--accent-action)]" : "bg-[var(--border-subtle)]"
              }`}
            />
            <span className="ml-1">{step}/2</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <h1
                  className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Elige tu base diaria
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Cada hábito ya viene calibrado en{" "}
                  <strong className="text-[var(--text-primary)] font-medium">
                    Bronce · Plata · Oro
                  </strong>
                  . En días pesados, el Bronce sostiene tu inercia.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor="mob-username"
                    className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                  >
                    ¿Cómo te llamamos?
                  </label>
                  <input
                    id="mob-username"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ej. Alex"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Hábitos sugeridos ({selectedIds.length} elegidos)
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      100% editables después
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STARTER_HABIT_TEMPLATES.map((tpl) => {
                      const active = selectedIds.includes(tpl.id);
                      const attrMeta = ATTRIBUTE_META[tpl.primaryAttribute];
                      return (
                        <motion.button
                          key={tpl.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleTemplate(tpl.id)}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            active
                              ? "border-[var(--accent-action)] bg-[var(--accent-action-soft)]/55"
                              : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  active
                                    ? "bg-[var(--accent-action)] text-white"
                                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                }`}
                              >
                                <HabitIcon name={tpl.icon} className="w-4 h-4" />
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                                  {tpl.title}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)]">
                                  +{attrMeta.label}
                                  {tpl.isSharedDuo ? " · Dúo" : ""}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                active
                                  ? "bg-[var(--accent-action)] border-[var(--accent-action)] text-white"
                                  : "border-[var(--border-strong)]"
                              }`}
                            >
                              {active && <Check className="w-3 h-3" />}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] tabular-nums text-[var(--text-secondary)]">
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              B {tpl.tiers.bronze.minutes}m
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              P {tpl.tiers.silver.minutes}m
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                              O {tpl.tiers.gold.minutes}m
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      soundEngine.playTap();
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-action)] text-white px-5 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="step-2"
                onSubmit={handleFinish}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <h1
                  className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Tu Misión #1 y tu Dúo
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Define una prioridad concreta para hoy y deja listo tu enlace 1-a-1 con pareja o mejor amigo.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="mob-first-mission"
                      className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
                    >
                      Misión Principal de hoy
                    </label>
                    <input
                      id="mob-first-mission"
                      type="text"
                      value={firstMission}
                      onChange={(e) => setFirstMission(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Users className="w-4 h-4 text-[var(--accent-action)]" />
                      Vínculo Dúo (1-a-1)
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Sincroniza metas diarias, toques rápidos y rescate SOS de 15 minutos.
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="mob-partner"
                          className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1"
                        >
                          Nombre de tu pareja / compañero
                        </label>
                        <input
                          id="mob-partner"
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder="Ej. Lucía"
                          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                        />
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                          Tu código de enlace Dúo
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="w-full flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold tabular-nums text-[var(--text-primary)] hover:border-[var(--border-strong)] cursor-pointer"
                        >
                          <span>{state.duo.inviteCode}</span>
                          <span className="text-xs font-medium text-[var(--accent-action)] flex items-center gap-1">
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copiar
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 cursor-pointer"
                  >
                    Atrás
                  </button>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-action)] text-white px-6 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-95"
                  >
                    Entrar a MOB
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
