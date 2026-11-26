"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActiveMissionSession,
  AttributeKey,
  BodyMeasurementSnapshot,
  FlashEvent,
  GymExercise,
  GymMuscleGroup,
  GymSetEntry,
  Habit,
  MedalTier,
  MobState,
  ProgressSubTab,
  TaskItem,
  TimeOfDay,
  ToastNotice,
} from "@/types/mob";
import {
  ACHIEVEMENTS_CATALOG,
  FLASH_EVENTS_POOL,
  getLocalDateKey,
  STARTER_HABIT_TEMPLATES,
} from "@/lib/templates";
import {
  buildBodySnapshot,
  calculateEpley1Rm,
  calculateSetVolume,
  isNewPersonalRecord,
  MORPHOLOGICAL_PROFILES,
} from "@/lib/fitness-domain";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/sound";

const STORAGE_KEY = "mob-app-state-v1";

function createInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "MOB-";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

const DEFAULT_GYM_EXERCISES: GymExercise[] = [
  { id: "ex-bench", name: "Press de Banca", muscleGroup: "push", isCompound: true },
  { id: "ex-squat", name: "Sentadilla Libre", muscleGroup: "legs", isCompound: true },
  { id: "ex-rdl", name: "Peso Muerto Rumano", muscleGroup: "legs", isCompound: true },
  { id: "ex-pullup", name: "Dominadas / Jalón", muscleGroup: "pull", isCompound: true },
  { id: "ex-ohp", name: "Press Militar", muscleGroup: "push", isCompound: true },
  { id: "ex-row", name: "Remo con Barra", muscleGroup: "pull", isCompound: true },
  { id: "ex-hip", name: "Hip Thrust", muscleGroup: "legs", isCompound: true },
  { id: "ex-curl", name: "Curl de Bíceps", muscleGroup: "pull", isCompound: false },
];

function buildSeedGymSets(): GymSetEntry[] {
  const rawSeeds: Array<{
    id: string;
    exerciseId: string;
    offsetDays: number;
    weightKg: number;
    reps: number;
  }> = [
    { id: "seed-set-1", exerciseId: "ex-bench", offsetDays: -28, weightKg: 60, reps: 8 },
    { id: "seed-set-2", exerciseId: "ex-squat", offsetDays: -28, weightKg: 80, reps: 6 },
    { id: "seed-set-3", exerciseId: "ex-row", offsetDays: -28, weightKg: 55, reps: 10 },
    { id: "seed-set-4", exerciseId: "ex-bench", offsetDays: -14, weightKg: 62.5, reps: 8 },
    { id: "seed-set-5", exerciseId: "ex-squat", offsetDays: -14, weightKg: 85, reps: 6 },
    { id: "seed-set-6", exerciseId: "ex-row", offsetDays: -14, weightKg: 57.5, reps: 10 },
    { id: "seed-set-7", exerciseId: "ex-bench", offsetDays: -5, weightKg: 65, reps: 8 },
    { id: "seed-set-8", exerciseId: "ex-squat", offsetDays: -5, weightKg: 90, reps: 6 },
    { id: "seed-set-9", exerciseId: "ex-row", offsetDays: -5, weightKg: 60, reps: 10 },
  ];

  return rawSeeds.map((item) => {
    const date = getLocalDateKey(item.offsetDays);
    return {
      id: item.id,
      exerciseId: item.exerciseId,
      date,
      weightKg: item.weightKg,
      reps: item.reps,
      estimated1RmKg: calculateEpley1Rm(item.weightKg, item.reps),
      volumeKg: calculateSetVolume(item.weightKg, item.reps),
      isPr: false,
      timestamp: `${date}T18:00:00.000Z`,
    };
  });
}

function buildSeedBodySnapshots(): BodyMeasurementSnapshot[] {
  return [
    buildBodySnapshot({
      id: "seed-body-1",
      date: getLocalDateKey(-42),
      sex: "male",
      heightCm: 178,
      weightKg: 78.4,
      neckCm: 38.5,
      waistCm: 85.5,
      shouldersCm: 114.0,
      chestCm: 99.5,
      bicepsCm: 35.0,
      thighCm: 56.5,
      calfCm: 37.5,
      modeUsed: "assisted",
      notes: "Punto de partida tranquilo",
    }),
    buildBodySnapshot({
      id: "seed-body-2",
      date: getLocalDateKey(-21),
      sex: "male",
      heightCm: 178,
      weightKg: 77.8,
      neckCm: 38.5,
      waistCm: 84.2,
      shouldersCm: 114.8,
      chestCm: 100.2,
      bicepsCm: 35.4,
      thighCm: 57.0,
      calfCm: 37.7,
      modeUsed: "solo",
      notes: "Mejor postura y energía sostenida",
    }),
    buildBodySnapshot({
      id: "seed-body-3",
      date: getLocalDateKey(-7),
      sex: "male",
      heightCm: 178,
      weightKg: 77.3,
      neckCm: 38.6,
      waistCm: 83.0,
      shouldersCm: 115.5,
      chestCm: 101.0,
      bicepsCm: 35.8,
      thighCm: 57.5,
      calfCm: 37.9,
      modeUsed: "assisted",
      notes: "Cintura más firme y fuerza en subida",
    }),
  ];
}

function buildInitialState(): MobState {
  const today = getLocalDateKey(0);
  const tomorrow = getLocalDateKey(1);

  return {
    onboarded: false,
    userName: "",
    momentum: 48,
    attributeXp: {
      energia: 135,
      fuerza: 110,
      enfoque: 140,
      disciplina: 125,
    },
    habits: [],
    habitLogs: [],
    tasks: [
      {
        id: "seed-task-1",
        title: "Definir mi prioridad #1 de esta semana",
        scheduledDate: today,
        timeOfDay: "morning",
        isMainMission: true,
        primaryAttribute: "enfoque",
        completed: false,
        postponeCount: 0,
        microSteps: [],
      },
      {
        id: "seed-task-2",
        title: "Dejar lista la mochila o ropa de mañana",
        scheduledDate: today,
        timeOfDay: "evening",
        isMainMission: false,
        primaryAttribute: "disciplina",
        completed: false,
        postponeCount: 0,
        microSteps: [],
      },
      {
        id: "seed-task-3",
        title: "Planificar salida o descanso del fin de semana",
        scheduledDate: tomorrow,
        timeOfDay: "afternoon",
        isMainMission: true,
        primaryAttribute: "energia",
        completed: false,
        postponeCount: 0,
        microSteps: [],
      },
    ],
    unlockedAchievementIds: {},
    completedFlashDates: [],
    duo: {
      connected: true,
      inviteCode: "MOB-7K4P",
      partnerName: "Lucía",
      partnerMomentum: 64,
      partnerTodayPct: 60,
      partnerMainMissionDone: true,
      partnerCompletedSharedHabitIds: [],
      duoSynergyDays: 4,
      nudges: [
        {
          id: "nudge-init",
          from: "partner",
          label: "Ya cerré mi misión de la mañana, ¡vamos a por el bonus!",
          timestamp: new Date().toISOString(),
        },
      ],
    },
    crewName: "Banda Norte",
    crewMembers: [
      {
        id: "crew-1",
        name: "Mateo",
        initials: "MT",
        momentum: 78,
        todayPct: 80,
        medalsThisWeek: { bronze: 2, silver: 3, gold: 2 },
        statusLabel: "En racha de foco",
      },
      {
        id: "crew-2",
        name: "Sofi",
        initials: "SF",
        momentum: 65,
        todayPct: 50,
        medalsThisWeek: { bronze: 3, silver: 2, gold: 1 },
        statusLabel: "Caminata cumplida",
      },
      {
        id: "crew-3",
        name: "Nico",
        initials: "NC",
        momentum: 52,
        todayPct: 35,
        medalsThisWeek: { bronze: 4, silver: 1, gold: 0 },
        statusLabel: "Sosteniendo el piso mínimo",
      },
    ],
    crewChallenge: {
      id: "chal-week-1",
      title: "Operación Sin Ceros",
      subtitle: "Sumar 28 medallas (Bronce o más) entre toda la Crew esta semana",
      targetMedals: 28,
      currentMedals: 18,
      daysRemaining: 3,
    },
    soundEnabled: true,
    bodySnapshots: buildSeedBodySnapshots(),
    gymExercises: DEFAULT_GYM_EXERCISES,
    gymSets: buildSeedGymSets(),
  };
}

interface MobContextValue {
  state: MobState;
  hydrated: boolean;
  todayKey: string;
  activeMission: ActiveMissionSession | null;
  toasts: ToastNotice[];
  todayFlashEvent: FlashEvent | null;
  cloudConnected: boolean;
  requestedProgressTab: ProgressSubTab;
  setRequestedProgressTab: (tab: ProgressSubTab) => void;
  completeOnboarding: (params: {
    userName: string;
    selectedTemplateIds: string[];
    partnerName?: string;
    customFirstMission?: string;
  }) => void;
  logHabitTier: (habitId: string, tier: MedalTier, dateKey?: string) => void;
  clearHabitLog: (habitId: string, dateKey?: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  deleteHabit: (habitId: string) => void;
  addTask: (params: {
    title: string;
    scheduledDate: string;
    timeOfDay: TimeOfDay;
    optionalTime?: string;
    isMainMission: boolean;
    primaryAttribute: AttributeKey;
  }) => void;
  toggleTaskComplete: (taskId: string, tierOverride?: MedalTier) => void;
  toggleTaskMainMission: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  applyMicroSteps: (taskId: string, stepTitles: string[]) => void;
  toggleMicroStep: (taskId: string, stepId: string) => void;
  postponeTaskIntentionally: (taskId: string, targetDate: string) => void;
  triggerDuoSosOnTask: (taskId: string) => void;
  startMissionSession: (session: ActiveMissionSession) => void;
  finishMissionSession: () => void;
  cancelMissionSession: () => void;
  completeFlashEvent: (event: FlashEvent) => void;
  dismissFlashEventToday: () => void;
  sendDuoNudge: (label: string) => void;
  simulatePartnerProgress: () => void;
  updatePartnerInfo: (partnerName: string, connected: boolean) => void;
  addCrewFriend: (name: string) => void;
  addBodySnapshot: (
    input: Omit<
      BodyMeasurementSnapshot,
      | "id"
      | "estimatedBodyFatPct"
      | "waistToHeightRatio"
      | "shoulderToWaistRatio"
      | "morphologicalProfile"
    >
  ) => BodyMeasurementSnapshot;
  deleteBodySnapshot: (id: string) => void;
  addGymExercise: (name: string, muscleGroup: GymMuscleGroup) => GymExercise;
  logGymSet: (
    exerciseId: string,
    weightKg: number,
    reps: number,
    dateKey?: string
  ) => GymSetEntry;
  deleteGymSet: (id: string) => void;
  toggleSound: () => void;
  dismissToast: (id: string) => void;
}

const MobContext = createContext<MobContextValue | null>(null);

export function MobProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MobState>(buildInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [activeMission, setActiveMission] = useState<ActiveMissionSession | null>(null);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [todayKey, setTodayKey] = useState<string>(() => getLocalDateKey(0));
  const [requestedProgressTab, setRequestedProgressTab] =
    useState<ProgressSubTab>("hud");

  const pushToast = useCallback(
    (title: string, subtitle?: string, tone: ToastNotice["tone"] = "sage") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, title, subtitle, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setTodayKey(getLocalDateKey(0));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MobState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          bodySnapshots: Array.isArray(parsed.bodySnapshots)
            ? parsed.bodySnapshots
            : prev.bodySnapshots,
          gymExercises: Array.isArray(parsed.gymExercises)
            ? parsed.gymExercises
            : prev.gymExercises,
          gymSets: Array.isArray(parsed.gymSets)
            ? parsed.gymSets
            : prev.gymSets,
          duo: {
            ...prev.duo,
            ...(parsed.duo ?? {}),
            inviteCode: parsed.duo?.inviteCode || createInviteCode(),
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          duo: { ...prev.duo, inviteCode: createInviteCode() },
        }));
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  // Persist changes
  useEffect(() => {
    if (!hydrated) return;
    soundEngine.soundEnabled = state.soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  // Cross-tab BroadcastChannel + Optional Supabase Realtime for Duo nudges/SOS
  useEffect(() => {
    if (!hydrated) return;

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("mob-duo-live");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "DUO_NUDGE") {
          setState((prev) => ({
            ...prev,
            duo: {
              ...prev.duo,
              nudges: [
                {
                  id: `nudge-${Date.now()}`,
                  from: "partner" as const,
                  label: String(ev.data.label),
                  timestamp: new Date().toISOString(),
                },
                ...prev.duo.nudges,
              ].slice(0, 8),
            },
          }));
          pushToast("Pulso de tu Dúo", String(ev.data.label), "action");
        }
      };
    }

    const supaChannel =
      supabase && state.duo.inviteCode
        ? supabase
            .channel(`duo-${state.duo.inviteCode}`)
            .on("broadcast", { event: "nudge" }, ({ payload }) => {
              if (!payload?.label) return;
              setState((prev) => ({
                ...prev,
                duo: {
                  ...prev.duo,
                  nudges: [
                    {
                      id: `nudge-${Date.now()}`,
                      from: "partner" as const,
                      label: String(payload.label),
                      timestamp: new Date().toISOString(),
                    },
                    ...prev.duo.nudges,
                  ].slice(0, 8),
                },
              }));
              pushToast(`Toque de ${state.duo.partnerName}`, String(payload.label), "action");
            })
            .subscribe()
        : null;

    return () => {
      bc?.close();
      if (supaChannel && supabase) {
        supabase.removeChannel(supaChannel);
      }
    };
  }, [hydrated, state.duo.inviteCode, state.duo.partnerName, pushToast]);

  // Helper to evaluate and unlock achievements automatically
  const checkAndUnlockAchievements = useCallback(
    (
      draft: MobState,
      extraFlags?: {
        beatProcrastination?: boolean;
        duoAction?: boolean;
        bodyCheckin?: boolean;
      }
    ): MobState => {
      const unlocked = { ...draft.unlockedAchievementIds };
      const newlyUnlocked: string[] = [];
      const nowIso = new Date().toISOString();

      const grant = (id: string) => {
        if (!unlocked[id]) {
          unlocked[id] = nowIso;
          newlyUnlocked.push(id);
        }
      };

      const totalActions =
        draft.habitLogs.length + draft.tasks.filter((t) => t.completed).length;
      if (totalActions >= 1) grant("ach-first-step");

      if (draft.habitLogs.some((l) => l.tier === "bronze")) {
        grant("ach-bronze-shield");
      }
      if (draft.habitLogs.some((l) => l.tier === "gold")) {
        grant("ach-gold-medal");
      }
      if (draft.tasks.some((t) => t.isMainMission && t.completed)) {
        grant("ach-main-mission");
      }
      if (extraFlags?.beatProcrastination) {
        grant("ach-anti-procrastination");
      }
      if (extraFlags?.duoAction) {
        grant("ach-duo-sync");
      }
      if (draft.momentum >= 75) {
        grant("ach-momentum-75");
      }
      if (draft.gymSets.some((s) => s.isPr)) {
        grant("ach-gym-pr");
      }
      if (draft.bodySnapshots.length >= 4 || extraFlags?.bodyCheckin) {
        grant("ach-body-checkin");
      }

      if (newlyUnlocked.length > 0) {
        const firstAch = ACHIEVEMENTS_CATALOG.find((a) => a.id === newlyUnlocked[0]);
        if (firstAch) {
          setTimeout(() => {
            soundEngine.playMedal("gold");
            pushToast(`Logro desbloqueado: ${firstAch.title}`, firstAch.description, "gold");
          }, 180);
        }
      }

      return { ...draft, unlockedAchievementIds: unlocked };
    },
    [pushToast]
  );

  const completeOnboarding = useCallback(
    ({
      userName,
      selectedTemplateIds,
      partnerName,
      customFirstMission,
    }: {
      userName: string;
      selectedTemplateIds: string[];
      partnerName?: string;
      customFirstMission?: string;
    }) => {
      soundEngine.playMedal("silver");
      const chosenTemplates = STARTER_HABIT_TEMPLATES.filter((t) =>
        selectedTemplateIds.includes(t.id)
      );
      const templatesToUse =
        chosenTemplates.length > 0 ? chosenTemplates : STARTER_HABIT_TEMPLATES.slice(0, 3);

      const createdHabits: Habit[] = templatesToUse.map((tpl, idx) => ({
        id: `hab-${Date.now()}-${idx}`,
        title: tpl.title,
        icon: tpl.icon,
        timeOfDay: tpl.timeOfDay,
        primaryAttribute: tpl.primaryAttribute,
        secondaryAttribute: tpl.secondaryAttribute,
        tiers: tpl.tiers,
        isSharedDuo: Boolean(tpl.isSharedDuo),
        activeDays: [0, 1, 2, 3, 4, 5, 6],
        createdAt: new Date().toISOString(),
      }));

      setState((prev) => {
        const updatedTasks = [...prev.tasks];
        if (customFirstMission && customFirstMission.trim()) {
          updatedTasks[0] = {
            ...updatedTasks[0],
            title: customFirstMission.trim(),
            scheduledDate: todayKey,
            isMainMission: true,
          };
        }
        return {
          ...prev,
          onboarded: true,
          userName: userName.trim() || "Jugador",
          habits: createdHabits,
          tasks: updatedTasks,
          duo: {
            ...prev.duo,
            partnerName: partnerName?.trim() || prev.duo.partnerName,
            connected: true,
          },
        };
      });

      pushToast("¡MOB listo!", "Empieza por un Bronce rápido o tu Misión Principal.", "sage");
    },
    [todayKey, pushToast]
  );

  const logHabitTier = useCallback(
    (habitId: string, tier: MedalTier, dateKey = todayKey) => {
      soundEngine.playMedal(tier);
      setState((prev) => {
        const habit = prev.habits.find((h) => h.id === habitId);
        if (!habit) return prev;

        const existing = prev.habitLogs.find(
          (l) => l.habitId === habitId && l.date === dateKey
        );

        const tierPoints: Record<MedalTier, number> = {
          bronze: 8,
          silver: 14,
          gold: 22,
        };
        const prevPoints = existing ? tierPoints[existing.tier] : 0;
        const deltaXp = Math.max(2, tierPoints[tier] - prevPoints);
        const momentumGain = existing ? 2 : tier === "gold" ? 6 : tier === "silver" ? 5 : 4;

        const nextLog = {
          id: existing?.id || `log-${Date.now()}`,
          habitId,
          date: dateKey,
          tier,
          minutesLogged: habit.tiers[tier].minutes,
          completedWithDuo: habit.isSharedDuo && prev.duo.connected,
          timestamp: new Date().toISOString(),
        };

        const filteredLogs = prev.habitLogs.filter(
          (l) => !(l.habitId === habitId && l.date === dateKey)
        );

        const nextXp = { ...prev.attributeXp };
        nextXp[habit.primaryAttribute] += deltaXp;
        if (habit.secondaryAttribute) {
          nextXp[habit.secondaryAttribute] += Math.round(deltaXp * 0.5);
        }

        const nextDraft: MobState = {
          ...prev,
          momentum: Math.min(100, prev.momentum + momentumGain),
          attributeXp: nextXp,
          habitLogs: [nextLog, ...filteredLogs],
          crewChallenge: existing
            ? prev.crewChallenge
            : {
                ...prev.crewChallenge,
                currentMedals: Math.min(
                  prev.crewChallenge.targetMedals,
                  prev.crewChallenge.currentMedals + 1
                ),
              },
        };

        return checkAndUnlockAchievements(nextDraft, {
          duoAction: habit.isSharedDuo && prev.duo.connected,
        });
      });
    },
    [todayKey, checkAndUnlockAchievements]
  );

  const clearHabitLog = useCallback(
    (habitId: string, dateKey = todayKey) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        momentum: Math.max(20, prev.momentum - 3),
        habitLogs: prev.habitLogs.filter(
          (l) => !(l.habitId === habitId && l.date === dateKey)
        ),
      }));
    },
    [todayKey]
  );

  const addHabit = useCallback(
    (habitInput: Omit<Habit, "id" | "createdAt">) => {
      soundEngine.playTap();
      const created: Habit = {
        ...habitInput,
        id: `hab-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        habits: [...prev.habits, created],
      }));
      pushToast("Hábito añadido", `${created.title} ya tiene niveles Bronce, Plata y Oro.`);
    },
    [pushToast]
  );

  const deleteHabit = useCallback((habitId: string) => {
    soundEngine.playTap();
    setState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
      habitLogs: prev.habitLogs.filter((l) => l.habitId !== habitId),
    }));
  }, []);

  const addTask = useCallback(
    (params: {
      title: string;
      scheduledDate: string;
      timeOfDay: TimeOfDay;
      optionalTime?: string;
      isMainMission: boolean;
      primaryAttribute: AttributeKey;
    }) => {
      soundEngine.playTap();
      setState((prev) => {
        const mainCountForDay = prev.tasks.filter(
          (t) => t.scheduledDate === params.scheduledDate && t.isMainMission && !t.completed
        ).length;
        const allowMain = params.isMainMission && mainCountForDay < 3;

        const newTask: TaskItem = {
          id: `task-${Date.now()}`,
          title: params.title.trim(),
          scheduledDate: params.scheduledDate,
          timeOfDay: params.timeOfDay,
          optionalTime: params.optionalTime || undefined,
          isMainMission: allowMain,
          primaryAttribute: params.primaryAttribute,
          completed: false,
          postponeCount: 0,
          microSteps: [],
        };

        if (params.isMainMission && !allowMain) {
          pushToast(
            "Máximo 3 Misiones Principales",
            "Se guardó como secundaria para mantener tu foco escaneable.",
            "action"
          );
        }

        return {
          ...prev,
          tasks: [newTask, ...prev.tasks],
        };
      });
    },
    [pushToast]
  );

  const toggleTaskComplete = useCallback(
    (taskId: string, tierOverride?: MedalTier) => {
      setState((prev) => {
        const target = prev.tasks.find((t) => t.id === taskId);
        if (!target) return prev;
        const nextCompleted = !target.completed;

        if (nextCompleted) {
          soundEngine.playMedal(tierOverride || (target.isMainMission ? "gold" : "silver"));
        } else {
          soundEngine.playTap();
        }

        const xpDelta = target.isMainMission ? 18 : 10;
        const nextXp = { ...prev.attributeXp };
        nextXp[target.primaryAttribute] = Math.max(
          0,
          nextXp[target.primaryAttribute] + (nextCompleted ? xpDelta : -xpDelta)
        );

        const nextTasks = prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: nextCompleted,
                completedTier: nextCompleted
                  ? tierOverride || (t.isMainMission ? "gold" : "silver")
                  : undefined,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              }
            : t
        );

        const nextDraft: MobState = {
          ...prev,
          momentum: nextCompleted
            ? Math.min(100, prev.momentum + (target.isMainMission ? 7 : 4))
            : Math.max(20, prev.momentum - 3),
          attributeXp: nextXp,
          tasks: nextTasks,
        };

        return checkAndUnlockAchievements(nextDraft, {
          beatProcrastination: nextCompleted && (target.postponeCount > 0 || Boolean(tierOverride === "bronze")),
          duoAction: nextCompleted && Boolean(target.duoSosActive),
        });
      });
    },
    [checkAndUnlockAchievements]
  );

  const toggleTaskMainMission = useCallback(
    (taskId: string) => {
      soundEngine.playTap();
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;
        if (!task.isMainMission) {
          const count = prev.tasks.filter(
            (t) => t.scheduledDate === task.scheduledDate && t.isMainMission && !t.completed
          ).length;
          if (count >= 3) {
            pushToast(
              "Ya tienes 3 Misiones Principales",
              "Menos es más: cierra o desmarca una antes de subir otra.",
              "action"
            );
            return prev;
          }
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, isMainMission: !t.isMainMission } : t
          ),
        };
      });
    },
    [pushToast]
  );

  const deleteTask = useCallback((taskId: string) => {
    soundEngine.playTap();
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  }, []);

  const applyMicroSteps = useCallback(
    (taskId: string, stepTitles: string[]) => {
      soundEngine.playTap();
      const steps = stepTitles
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title, idx) => ({
          id: `ms-${Date.now()}-${idx}`,
          title,
          done: false,
        }));
      if (steps.length === 0) return;

      setState((prev) => {
        const nextDraft: MobState = {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, microSteps: steps } : t
          ),
        };
        return checkAndUnlockAchievements(nextDraft, { beatProcrastination: true });
      });
      pushToast("Dividida en micro-pasos", "Completa solo el primero para romper la inercia.");
    },
    [checkAndUnlockAchievements, pushToast]
  );

  const toggleMicroStep = useCallback(
    (taskId: string, stepId: string) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        momentum: Math.min(100, prev.momentum + 1),
        tasks: prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const updatedSteps = t.microSteps.map((s) =>
            s.id === stepId ? { ...s, done: !s.done } : s
          );
          return { ...t, microSteps: updatedSteps };
        }),
      }));
    },
    []
  );

  const postponeTaskIntentionally = useCallback(
    (taskId: string, targetDate: string) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        // Gentle SDT momentum adjustment: tiny -1 nudge, never punitive reset
        momentum: Math.max(25, prev.momentum - 1),
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                scheduledDate: targetDate,
                postponeCount: t.postponeCount + 1,
              }
            : t
        ),
      }));
      pushToast("Reprogramada sin culpa", "Quedó ubicada en tu nuevo día elegido.");
    },
    [pushToast]
  );

  const triggerDuoSosOnTask = useCallback(
    (taskId: string) => {
      soundEngine.playMedal("silver");
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;
        const nextDraft: MobState = {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, duoSosActive: true } : t
          ),
          duo: {
            ...prev.duo,
            activeSosTaskId: taskId,
            nudges: [
              {
                id: `nudge-${Date.now()}`,
                from: "me" as const,
                label: `SOS Co-op 15m activado para "${task.title}"`,
                timestamp: new Date().toISOString(),
              },
              ...prev.duo.nudges,
            ].slice(0, 8),
          },
        };
        return checkAndUnlockAchievements(nextDraft, { duoAction: true });
      });

      const taskObj = state.tasks.find((t) => t.id === taskId);
      if (taskObj) {
        setActiveMission({
          type: "task",
          itemId: taskObj.id,
          title: taskObj.title,
          targetMinutes: 15,
          isCoopDuo: true,
          attribute: taskObj.primaryAttribute,
        });
      }
      pushToast(
        `SOS enviado a ${state.duo.partnerName}`,
        "Arrancando bloque Co-op de 15 minutos juntos.",
        "action"
      );
    },
    [state.tasks, state.duo.partnerName, checkAndUnlockAchievements, pushToast]
  );

  const startMissionSession = useCallback((session: ActiveMissionSession) => {
    soundEngine.playTap();
    setActiveMission(session);
  }, []);

  const cancelMissionSession = useCallback(() => {
    soundEngine.toggleAmbientFocus(false);
    setActiveMission(null);
  }, []);

  const finishMissionSession = useCallback(() => {
    soundEngine.toggleAmbientFocus(false);
    if (!activeMission) return;

    if (activeMission.type === "habit") {
      logHabitTier(activeMission.itemId, activeMission.tierTarget || "silver");
    } else if (activeMission.type === "task") {
      const existing = state.tasks.find((t) => t.id === activeMission.itemId);
      if (existing && !existing.completed) {
        toggleTaskComplete(activeMission.itemId, activeMission.tierTarget);
      }
    } else if (activeMission.type === "flash") {
      const flash = FLASH_EVENTS_POOL.find((f) => f.id === activeMission.itemId);
      if (flash) {
        soundEngine.playMedal("silver");
        setState((prev) => {
          const nextXp = { ...prev.attributeXp };
          nextXp[flash.attribute] += 12;
          return checkAndUnlockAchievements(
            {
              ...prev,
              momentum: Math.min(100, prev.momentum + flash.momentumBoost),
              attributeXp: nextXp,
              completedFlashDates: [...prev.completedFlashDates, todayKey],
            },
            { beatProcrastination: true }
          );
        });
        pushToast("¡Evento Relámpago superado!", `+${flash.momentumBoost}% de Inercia directa.`);
      }
    }

    setActiveMission(null);
  }, [activeMission, logHabitTier, state.tasks, toggleTaskComplete, checkAndUnlockAchievements, todayKey, pushToast]);

  const completeFlashEvent = useCallback(
    (event: FlashEvent) => {
      soundEngine.playMedal("silver");
      setState((prev) => {
        const nextXp = { ...prev.attributeXp };
        nextXp[event.attribute] += 12;
        return checkAndUnlockAchievements(
          {
            ...prev,
            momentum: Math.min(100, prev.momentum + event.momentumBoost),
            attributeXp: nextXp,
            completedFlashDates: [...prev.completedFlashDates, todayKey],
          },
          { beatProcrastination: true }
        );
      });
      pushToast("¡Encuentro Relámpago completado!", `+${event.momentumBoost}% de Inercia.`);
    },
    [todayKey, checkAndUnlockAchievements, pushToast]
  );

  const dismissFlashEventToday = useCallback(() => {
    soundEngine.playTap();
    setState((prev) => ({
      ...prev,
      dismissedFlashDate: todayKey,
    }));
  }, [todayKey]);

  const sendDuoNudge = useCallback(
    (label: string) => {
      soundEngine.playTap();
      setState((prev) => {
        const nextDraft: MobState = {
          ...prev,
          duo: {
            ...prev.duo,
            nudges: [
              {
                id: `nudge-${Date.now()}`,
                from: "me" as const,
                label,
                timestamp: new Date().toISOString(),
              },
              ...prev.duo.nudges,
            ].slice(0, 8),
          },
        };
        return checkAndUnlockAchievements(nextDraft, { duoAction: true });
      });

      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("mob-duo-live");
        bc.postMessage({ type: "DUO_NUDGE", label });
        bc.close();
      }
      if (supabase && state.duo.inviteCode) {
        supabase.channel(`duo-${state.duo.inviteCode}`).send({
          type: "broadcast",
          event: "nudge",
          payload: { label },
        });
      }

      pushToast(`Enviado a ${state.duo.partnerName}`, label);
    },
    [state.duo.inviteCode, state.duo.partnerName, checkAndUnlockAchievements, pushToast]
  );

  const simulatePartnerProgress = useCallback(() => {
    soundEngine.playMedal("gold");
    setState((prev) => {
      const sharedIds = prev.habits.filter((h) => h.isSharedDuo).map((h) => h.id);
      const nextPct = Math.min(100, prev.duo.partnerTodayPct + 25);
      return checkAndUnlockAchievements(
        {
          ...prev,
          momentum: Math.min(100, prev.momentum + 3),
          duo: {
            ...prev.duo,
            partnerTodayPct: nextPct,
            partnerMomentum: Math.min(100, prev.duo.partnerMomentum + 6),
            partnerMainMissionDone: true,
            partnerCompletedSharedHabitIds: sharedIds,
            duoSynergyDays:
              nextPct >= 80 ? prev.duo.duoSynergyDays + 1 : prev.duo.duoSynergyDays,
            nudges: [
              {
                id: `nudge-sim-${Date.now()}`,
                from: "partner" as const,
                label: "¡Acabo de sumar una medalla de Oro! Nos activó el impulso mutuo.",
                timestamp: new Date().toISOString(),
              },
              ...prev.duo.nudges,
            ].slice(0, 8),
          },
        },
        { duoAction: true }
      );
    });
    pushToast(
      `¡${state.duo.partnerName} avanzó en su día!`,
      "+3% Bonus de Sincronía Dúo sumado a tu Inercia.",
      "gold"
    );
  }, [state.duo.partnerName, checkAndUnlockAchievements, pushToast]);

  const updatePartnerInfo = useCallback(
    (partnerName: string, connected: boolean) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        duo: {
          ...prev.duo,
          partnerName: partnerName.trim() || prev.duo.partnerName,
          connected,
        },
      }));
      pushToast("Vínculo Dúo actualizado", connected ? `Conectado con ${partnerName}` : "Modo individual");
    },
    [pushToast]
  );

  const addCrewFriend = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      soundEngine.playTap();
      const initials = clean
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setState((prev) => ({
        ...prev,
        crewMembers: [
          ...prev.crewMembers,
          {
            id: `crew-${Date.now()}`,
            name: clean,
            initials: initials || "MB",
            momentum: 55,
            todayPct: 40,
            medalsThisWeek: { bronze: 2, silver: 1, gold: 0 },
            statusLabel: "Recién sumado a la Crew",
          },
        ],
      }));
      pushToast(`${clean} se unió a tu Crew`, "Sus tareas personales siguen siendo privadas.");
    },
    [pushToast]
  );

  const addBodySnapshot = useCallback(
    (
      input: Omit<
        BodyMeasurementSnapshot,
        | "id"
        | "estimatedBodyFatPct"
        | "waistToHeightRatio"
        | "shoulderToWaistRatio"
        | "morphologicalProfile"
      >
    ): BodyMeasurementSnapshot => {
      soundEngine.playMedal("silver");
      const snapshot = buildBodySnapshot(input);
      setState((prev) => {
        const nextXp = { ...prev.attributeXp };
        nextXp.disciplina += 12;
        nextXp.fuerza += 8;
        const nextSnapshots = [...prev.bodySnapshots, snapshot].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        const nextDraft: MobState = {
          ...prev,
          momentum: Math.min(100, prev.momentum + 4),
          attributeXp: nextXp,
          bodySnapshots: nextSnapshots,
        };
        return checkAndUnlockAchievements(nextDraft, { bodyCheckin: true });
      });
      pushToast(
        "Control corporal guardado",
        `${MORPHOLOGICAL_PROFILES[snapshot.morphologicalProfile].label} · WHtR ${snapshot.waistToHeightRatio.toFixed(2)}`,
        "sage"
      );
      return snapshot;
    },
    [checkAndUnlockAchievements, pushToast]
  );

  const deleteBodySnapshot = useCallback((id: string) => {
    soundEngine.playTap();
    setState((prev) => ({
      ...prev,
      bodySnapshots: prev.bodySnapshots.filter((b) => b.id !== id),
    }));
  }, []);

  const addGymExercise = useCallback(
    (name: string, muscleGroup: GymMuscleGroup): GymExercise => {
      soundEngine.playTap();
      const cleanName = name.trim() || "Ejercicio personalizado";
      const created: GymExercise = {
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: cleanName,
        muscleGroup,
        isCompound: false,
      };
      setState((prev) => ({
        ...prev,
        gymExercises: [...prev.gymExercises, created],
      }));
      pushToast("Ejercicio añadido", `${created.name} listo para registrar series.`);
      return created;
    },
    [pushToast]
  );

  const logGymSet = useCallback(
    (
      exerciseId: string,
      weightKg: number,
      reps: number,
      dateKey = todayKey
    ): GymSetEntry => {
      const cleanWeight = Math.max(0, Number(weightKg) || 0);
      const cleanReps = Math.max(0, Math.round(Number(reps) || 0));
      const estimated1RmKg = calculateEpley1Rm(cleanWeight, cleanReps);
      const volumeKg = calculateSetVolume(cleanWeight, cleanReps);
      const prevForExercise = state.gymSets.filter(
        (s) => s.exerciseId === exerciseId
      );
      const isPr = isNewPersonalRecord(estimated1RmKg, prevForExercise);

      const entry: GymSetEntry = {
        id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exerciseId,
        date: dateKey,
        weightKg: cleanWeight,
        reps: cleanReps,
        estimated1RmKg,
        volumeKg,
        isPr,
        timestamp: new Date().toISOString(),
      };

      soundEngine.playMedal(isPr ? "gold" : "bronze");

      setState((prev) => {
        const latestPrevForEx = prev.gymSets.filter(
          (s) => s.exerciseId === exerciseId
        );
        const verifiedPr = isNewPersonalRecord(estimated1RmKg, latestPrevForEx);
        const committedEntry: GymSetEntry =
          verifiedPr === entry.isPr ? entry : { ...entry, isPr: verifiedPr };

        const nextXp = { ...prev.attributeXp };
        nextXp.fuerza += committedEntry.isPr ? 14 : 6;
        nextXp.disciplina += 3;

        const nextDraft: MobState = {
          ...prev,
          momentum: Math.min(
            100,
            prev.momentum + (committedEntry.isPr ? 5 : 2)
          ),
          attributeXp: nextXp,
          gymSets: [...prev.gymSets, committedEntry],
        };
        return checkAndUnlockAchievements(nextDraft);
      });

      if (isPr) {
        pushToast(
          "¡Nuevo Récord Personal!",
          `1RM estimado: ${estimated1RmKg} kg`,
          "gold"
        );
      }

      return entry;
    },
    [todayKey, state.gymSets, checkAndUnlockAchievements, pushToast]
  );

  const deleteGymSet = useCallback((id: string) => {
    soundEngine.playTap();
    setState((prev) => ({
      ...prev,
      gymSets: prev.gymSets.filter((s) => s.id !== id),
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => {
      const next = !prev.soundEnabled;
      soundEngine.soundEnabled = next;
      if (next) soundEngine.playTap();
      return { ...prev, soundEnabled: next };
    });
  }, []);

  const todayFlashEvent = useMemo(() => {
    if (
      state.dismissedFlashDate === todayKey ||
      state.completedFlashDates.includes(todayKey)
    ) {
      return null;
    }
    const daySeed = todayKey
      .split("-")
      .reduce((acc, part) => acc + Number(part || 0), 0);
    return FLASH_EVENTS_POOL[daySeed % FLASH_EVENTS_POOL.length];
  }, [state.dismissedFlashDate, state.completedFlashDates, todayKey]);

  const value = useMemo<MobContextValue>(
    () => ({
      state,
      hydrated,
      todayKey,
      activeMission,
      toasts,
      todayFlashEvent,
      cloudConnected: isSupabaseConfigured,
      requestedProgressTab,
      setRequestedProgressTab,
      completeOnboarding,
      logHabitTier,
      clearHabitLog,
      addHabit,
      deleteHabit,
      addTask,
      toggleTaskComplete,
      toggleTaskMainMission,
      deleteTask,
      applyMicroSteps,
      toggleMicroStep,
      postponeTaskIntentionally,
      triggerDuoSosOnTask,
      startMissionSession,
      finishMissionSession,
      cancelMissionSession,
      completeFlashEvent,
      dismissFlashEventToday,
      sendDuoNudge,
      simulatePartnerProgress,
      updatePartnerInfo,
      addCrewFriend,
      addBodySnapshot,
      deleteBodySnapshot,
      addGymExercise,
      logGymSet,
      deleteGymSet,
      toggleSound,
      dismissToast,
    }),
    [
      state,
      hydrated,
      todayKey,
      activeMission,
      toasts,
      todayFlashEvent,
      requestedProgressTab,
      completeOnboarding,
      logHabitTier,
      clearHabitLog,
      addHabit,
      deleteHabit,
      addTask,
      toggleTaskComplete,
      toggleTaskMainMission,
      deleteTask,
      applyMicroSteps,
      toggleMicroStep,
      postponeTaskIntentionally,
      triggerDuoSosOnTask,
      startMissionSession,
      finishMissionSession,
      cancelMissionSession,
      completeFlashEvent,
      dismissFlashEventToday,
      sendDuoNudge,
      simulatePartnerProgress,
      updatePartnerInfo,
      addCrewFriend,
      addBodySnapshot,
      deleteBodySnapshot,
      addGymExercise,
      logGymSet,
      deleteGymSet,
      toggleSound,
      dismissToast,
    ]
  );

  return <MobContext.Provider value={value}>{children}</MobContext.Provider>;
}

export function useMob() {
  const ctx = useContext(MobContext);
  if (!ctx) throw new Error("useMob must be used inside MobProvider");
  return ctx;
}
