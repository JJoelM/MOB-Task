"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NavSection } from "@/types/mob";
import { MobProvider, useMob } from "@/context/MobContext";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { AppShell } from "@/components/AppShell";
import { TodayView } from "@/components/TodayView";
import { PlanView } from "@/components/PlanView";
import { ProgressHudView } from "@/components/ProgressHudView";
import { BondsView } from "@/components/BondsView";
import { MissionFocusOverlay } from "@/components/MissionFocusOverlay";

function MobWorkspace() {
  const { state, hydrated, setRequestedProgressTab } = useMob();
  const [activeNav, setActiveNav] = useState<NavSection>("today");

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-canvas)]">
        <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-action)] animate-pulse" />
          Cargando MOB...
        </div>
      </div>
    );
  }

  if (!state.onboarded) {
    return <OnboardingFlow />;
  }

  return (
    <>
      <AppShell activeNav={activeNav} onSelectNav={setActiveNav}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {activeNav === "today" && (
              <TodayView
                onOpenGymTracker={() => {
                  setRequestedProgressTab("gym");
                  setActiveNav("progress");
                }}
              />
            )}
            {activeNav === "plan" && <PlanView />}
            {activeNav === "progress" && <ProgressHudView />}
            {activeNav === "bonds" && <BondsView />}
          </motion.div>
        </AnimatePresence>
      </AppShell>

      <MissionFocusOverlay />
    </>
  );
}

export default function HomePage() {
  return (
    <MobProvider>
      <MobWorkspace />
    </MobProvider>
  );
}
