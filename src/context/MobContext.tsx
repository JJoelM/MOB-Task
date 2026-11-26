"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActiveMissionSession,
  AttributeKey,
  BodyMeasurementSnapshot,
  DuoOperationState,
  FlashEvent,
  GymExercise,
  GymMuscleGroup,
  GymSetEntry,
  Habit,
  MedalTier,
  MissionPassedStamp,
  MobEmotionId,
  MobHundredMoment,
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
import {
  advanceMobCharge,
  createDuoOperationFromTemplate,
  isMobShieldActive,
  MOB_CHARGE_DELTAS,
  MOB_EMOTION_META,
} from "@/lib/mob-meter-domain";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { soundEngine } from "@/lib/sound";

const STORAGE_KEY = "mob-app-state-v1";
const RESPECT_SALUTE_MESSAGE =
  "¡Buen esfuerzo! El trabajo constante nunca traiciona.";

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

function buildSeedHundredMoments(): MobHundredMoment[] {
  const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(nineDaysAgo.getTime() + 24 * 60 * 60 * 1000);
  return [
    {
      id: "seed-mob100-1",
      emotion: "determinacion",
      title: MOB_EMOTION_META.determinacion.title,
      subtitle: MOB_EMOTION_META.determinacion.subtitle,
      triggerAction: "Misión Principal + racha de piso mínimo",
      unlockedAt: nineDaysAgo.toISOString(),
      shieldExpiresAt: eightDaysAgo.toISOString(),
    },
  ];
}

function buildSeedDuoOperation(): DuoOperationState {
  const base = createDuoOperationFromTemplate("op-doble-turno", 1);
  let markedPartnerStage = false;
  return {
    ...base,
    stages: base.stages.map((stage) => {
      if (!markedPartnerStage && stage.owner === "partner") {
        markedPartnerStage = true;
        return { ...stage, completed: true };
      }
      return stage;
    }),
  };
}

function buildInitialState(): MobState {
  const today = getLocalDateKey(0);
  const tomorrow = getLocalDateKey(1);

  return {
    onboarded: false,
    userName: "",
    momentum: 48,
    mobCharge: 82,
    mobCycleSources: {
      determinacion: 24,
      coraje: 18,
      vinculo: 16,
      claridad: 24,
    },
    mobHundredMoments: buildSeedHundredMoments(),
    duoOperation: buildSeedDuoOperation(),
    closedDayDates: [],
    respectSentTodayKeys: [],
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
  missionStamp: MissionPassedStamp | null;
  dismissMissionStamp: () => void;
  activeHundredMoment: MobHundredMoment | null;
  acknowledgeHundredMoment: () => void;
  shieldActive: boolean;
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
  toggleDuoOperationStage: (stageId: string) => void;
  switchDuoOperationTemplate: (templateId: string) => void;
  sendRespectSalute: (targetKey: string, targetName: string) => void;
  completeDayDebrief: (tomorrowMissionTitle?: string) => void;
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
  const [missionStamp, setMissionStamp] = useState<MissionPassedStamp | null>(null);
  const [activeHundredMoment, setActiveHundredMoment] =
    useState<MobHundredMoment | null>(null);

  const stampTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHundredSoundTsRef = useRef<number>(0);

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

  const dismissMissionStamp = useCallback(() => {
    if (stampTimeoutRef.current) {
      clearTimeout(stampTimeoutRef.current);
      stampTimeoutRef.current = null;
    }
    setMissionStamp(null);
  }, []);

  const showMissionStamp = useCallback((stamp: MissionPassedStamp) => {
    if (stampTimeoutRef.current) {
      clearTimeout(stampTimeoutRef.current);
    }
    setMissionStamp(stamp);
    stampTimeoutRef.current = setTimeout(() => {
      setMissionStamp(null);
      stampTimeoutRef.current = null;
    }, 2400);
  }, []);

  const acknowledgeHundredMoment = useCallback(() => {
    soundEngine.playTap();
    setActiveHundredMoment(null);
  }, []);

  useEffect(() => {
    return () => {
      if (stampTimeoutRef.current) {
        clearTimeout(stampTimeoutRef.current);
      }
    };
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
          mobCharge:
            typeof parsed.mobCharge === "number" &&
            Number.isFinite(parsed.mobCharge)
              ? Math.max(0, Math.min(99, Math.round(parsed.mobCharge)))
              : prev.mobCharge,
          mobCycleSources:
            parsed.mobCycleSources && typeof parsed.mobCycleSources === "object"
              ? {
                  determinacion:
                    Number(parsed.mobCycleSources.determinacion) || 0,
                  coraje: Number(parsed.mobCycleSources.coraje) || 0,
                  vinculo: Number(parsed.mobCycleSources.vinculo) || 0,
                  claridad: Number(parsed.mobCycleSources.claridad) || 0,
                }
              : prev.mobCycleSources,
          mobShieldUntil:
            typeof parsed.mobShieldUntil === "string"
              ? parsed.mobShieldUntil
              : prev.mobShieldUntil,
          mobHundredMoments: Array.isArray(parsed.mobHundredMoments)
            ? parsed.mobHundredMoments
            : prev.mobHundredMoments,
          duoOperation:
            parsed.duoOperation &&
            typeof parsed.duoOperation === "object" &&
            Array.isArray(parsed.duoOperation.stages)
              ? {
                  ...prev.duoOperation,
                  ...parsed.duoOperation,
                }
              : prev.duoOperation,
          closedDayDates: Array.isArray(parsed.closedDayDates)
            ? parsed.closedDayDates
            : prev.closedDayDates,
          respectSentTodayKeys: Array.isArray(parsed.respectSentTodayKeys)
            ? parsed.respectSentTodayKeys
            : prev.respectSentTodayKeys,
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
              }))
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
        mobHundredDetonation?: boolean;
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
      if (
        draft.mobHundredMoments.length >= 2 ||
        extraFlags?.mobHundredDetonation
      ) {
        grant("ach-mob-100");
      }

      if (newlyUnlocked.length > 0) {
        const firstAch = ACHIEVEMENTS_CATALOG.find((a) => a.id === newlyUnlocked[0]);
        if (firstAch) {
          setTimeout(() => {
            if (!extraFlags?.mobHundredDetonation) {
              soundEngine.playMedal("gold");
            }
            pushToast(`Logro desbloqueado: ${firstAch.title}`, firstAch.description, "gold");
          }, 180);
        }
      }

      return { ...draft, unlockedAchievementIds: unlocked };
    },
    [pushToast]
  );

  // Unified MOB 0% -> 100% progression + detonation side-effects + optional MissionPassedStamp
  const applyMobChargeAndEffects = useCallback(
    (
      draft: MobState,
      params: {
        delta: number;
        emotionSource: MobEmotionId;
        triggerAction: string;
        stampCandidate?: Omit<MissionPassedStamp, "id" | "fromCharge" | "toCharge">;
      }
    ): { updatedDraft: MobState; reachedHundred: boolean } => {
      const fromCharge = draft.mobCharge;
      const chargeRes = advanceMobCharge({
        currentCharge: draft.mobCharge,
        cycleSources: draft.mobCycleSources,
        delta: params.delta,
        emotionSource: params.emotionSource,
        triggerAction: params.triggerAction,
      });

      if (chargeRes.reachedHundred && chargeRes.moment) {
        const capturedMoment = chargeRes.moment;
        setTimeout(() => {
          const now = Date.now();
          if (now - lastHundredSoundTsRef.current > 150) {
            lastHundredSoundTsRef.current = now;
            soundEngine.playMobHundredSequence();
          }
          dismissMissionStamp();
          setActiveHundredMoment(capturedMoment);
        }, 0);

        return {
          reachedHundred: true,
          updatedDraft: {
            ...draft,
            mobCharge: chargeRes.nextCharge,
            mobCycleSources: chargeRes.nextSources,
            mobShieldUntil: chargeRes.nextShieldUntil,
            mobHundredMoments: [capturedMoment, ...draft.mobHundredMoments],
            duo: {
              ...draft.duo,
              partnerMomentum: Math.min(100, draft.duo.partnerMomentum + 5),
            },
            crewChallenge: {
              ...draft.crewChallenge,
              currentMedals: Math.min(
                draft.crewChallenge.targetMedals,
                draft.crewChallenge.currentMedals + 2
              ),
            },
          },
        };
      }

      if (params.stampCandidate) {
        const candidate = params.stampCandidate;
        const nextCharge = chargeRes.nextCharge;
        setTimeout(() => {
          showMissionStamp({
            id: `stamp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            headline: candidate.headline,
            itemTitle: candidate.itemTitle,
            fromCharge,
            toCharge: nextCharge,
            attribute: candidate.attribute,
          });
        }, 0);
      }

      return {
        reachedHundred: false,
        updatedDraft: {
          ...draft,
          mobCharge: chargeRes.nextCharge,
          mobCycleSources: chargeRes.nextSources,
        },
      };
    },
    [dismissMissionStamp, showMissionStamp]
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
        const tierMobCharge: Record<MedalTier, number> = {
          bronze: MOB_CHARGE_DELTAS.HABIT_BRONZE,
          silver: MOB_CHARGE_DELTAS.HABIT_SILVER,
          gold: MOB_CHARGE_DELTAS.HABIT_GOLD,
        };

        const prevPoints = existing ? tierPoints[existing.tier] : 0;
        const deltaXp = Math.max(2, tierPoints[tier] - prevPoints);
        const momentumGain = existing ? 2 : tier === "gold" ? 6 : tier === "silver" ? 5 : 4;
        const chargeDelta = existing
          ? Math.max(0, tierMobCharge[tier] - tierMobCharge[existing.tier])
          : tierMobCharge[tier];

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

        const emotionSource: MobEmotionId =
          habit.isSharedDuo && prev.duo.connected
            ? "vinculo"
            : habit.primaryAttribute === "enfoque"
            ? "claridad"
            : habit.primaryAttribute === "fuerza"
            ? "coraje"
            : "determinacion";

        const baseDraft: MobState = {
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

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: chargeDelta,
            emotionSource,
            triggerAction: `${habit.title} (${
              tier === "gold" ? "Oro" : tier === "silver" ? "Plata" : "Bronce"
            })`,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          duoAction: habit.isSharedDuo && prev.duo.connected,
          mobHundredDetonation: reachedHundred,
        });
      });
    },
    [todayKey, applyMobChargeAndEffects, checkAndUnlockAchievements]
  );

  const clearHabitLog = useCallback(
    (habitId: string, dateKey = todayKey) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        momentum: isMobShieldActive(prev.mobShieldUntil)
          ? prev.momentum
          : Math.max(20, prev.momentum - 3),
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

        const shielded = isMobShieldActive(prev.mobShieldUntil);

        const baseDraft: MobState = {
          ...prev,
          momentum: nextCompleted
            ? Math.min(100, prev.momentum + (target.isMainMission ? 7 : 4))
            : shielded
            ? prev.momentum
            : Math.max(20, prev.momentum - 3),
          attributeXp: nextXp,
          tasks: nextTasks,
        };

        if (!nextCompleted) {
          return baseDraft;
        }

        const emotionSource: MobEmotionId = target.duoSosActive
          ? "vinculo"
          : target.postponeCount > 0 || tierOverride === "bronze"
          ? "coraje"
          : target.isMainMission || target.primaryAttribute === "enfoque"
          ? "claridad"
          : "determinacion";

        const chargeDelta = target.isMainMission
          ? MOB_CHARGE_DELTAS.MAIN_MISSION
          : MOB_CHARGE_DELTAS.SECONDARY_TASK;

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: chargeDelta,
            emotionSource,
            triggerAction: target.isMainMission
              ? `Misión Principal: ${target.title}`
              : target.title,
            stampCandidate: target.isMainMission
              ? {
                  headline: "MISIÓN PRINCIPAL SUPERADA",
                  itemTitle: target.title,
                  attribute: target.primaryAttribute,
                }
              : undefined,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          beatProcrastination:
            target.postponeCount > 0 || Boolean(tierOverride === "bronze"),
          duoAction: Boolean(target.duoSosActive),
          mobHundredDetonation: reachedHundred,
        });
      });
    },
    [applyMobChargeAndEffects, checkAndUnlockAchievements]
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
        const target = prev.tasks.find((t) => t.id === taskId);
        if (!target) return prev;
        const firstSplit = target.microSteps.length === 0;

        const baseDraft: MobState = {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, microSteps: steps } : t
          ),
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: firstSplit ? MOB_CHARGE_DELTAS.ANTI_PROCRASTINATION : 0,
            emotionSource: "coraje",
            triggerAction: `Fricción vencida: ${target.title}`,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          beatProcrastination: true,
          mobHundredDetonation: reachedHundred,
        });
      });
      pushToast("Dividida en micro-pasos", "Completa solo el primero para romper la inercia.");
    },
    [applyMobChargeAndEffects, checkAndUnlockAchievements, pushToast]
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
        // Gentle SDT momentum adjustment: tiny -1 nudge, protected when MOB Shield is active
        momentum: isMobShieldActive(prev.mobShieldUntil)
          ? prev.momentum
          : Math.max(25, prev.momentum - 1),
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

  const completeFlashEvent = useCallback(
    (event: FlashEvent) => {
      soundEngine.playMedal("silver");
      setState((prev) => {
        const alreadyDone = prev.completedFlashDates.includes(todayKey);
        const nextXp = { ...prev.attributeXp };
        nextXp[event.attribute] += 12;

        const baseDraft: MobState = {
          ...prev,
          momentum: Math.min(100, prev.momentum + event.momentumBoost),
          attributeXp: nextXp,
          completedFlashDates: alreadyDone
            ? prev.completedFlashDates
            : [...prev.completedFlashDates, todayKey],
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: alreadyDone ? 0 : MOB_CHARGE_DELTAS.FLASH_EVENT,
            emotionSource: "coraje",
            triggerAction: event.title,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          beatProcrastination: true,
          mobHundredDetonation: reachedHundred,
        });
      });
      pushToast("¡Encuentro Relámpago completado!", `+${event.momentumBoost}% de Inercia.`);
    },
    [todayKey, applyMobChargeAndEffects, checkAndUnlockAchievements, pushToast]
  );

  const startMissionSession = useCallback((session: ActiveMissionSession) => {
    soundEngine.playTap();
    setActiveMission(session);
  }, []);

  const cancelMissionSession = useCallback(() => {
    soundEngine.playTap();
    setActiveMission(null);
  }, []);

  const finishMissionSession = useCallback(() => {
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
        completeFlashEvent(flash);
      }
    }

    setActiveMission(null);
  }, [
    activeMission,
    logHabitTier,
    state.tasks,
    toggleTaskComplete,
    completeFlashEvent,
  ]);

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

  const toggleDuoOperationStage = useCallback(
    (stageId: string) => {
      setState((prev) => {
        const targetStage = prev.duoOperation.stages.find(
          (s) => s.id === stageId
        );
        if (!targetStage) return prev;

        const wasAllCompleted = prev.duoOperation.stages.every(
          (s) => s.completed
        );
        const nextCompleted = !targetStage.completed;
        const updatedStages = prev.duoOperation.stages.map((s) =>
          s.id === stageId ? { ...s, completed: nextCompleted } : s
        );
        const nowAllCompleted =
          nextCompleted && updatedStages.every((s) => s.completed);

        if (!nextCompleted) {
          soundEngine.playTap();
          return {
            ...prev,
            duoOperation: {
              ...prev.duoOperation,
              stages: updatedStages,
              completedCount: wasAllCompleted
                ? Math.max(0, prev.duoOperation.completedCount - 1)
                : prev.duoOperation.completedCount,
            },
          };
        }

        soundEngine.playMedal(nowAllCompleted ? "gold" : "silver");

        const nextXp = { ...prev.attributeXp };
        nextXp.energia += nowAllCompleted ? 10 : 6;
        if (nowAllCompleted) {
          nextXp.disciplina += 10;
        }

        const baseDraft: MobState = {
          ...prev,
          momentum: Math.min(
            100,
            prev.momentum + (nowAllCompleted ? 6 : 3)
          ),
          attributeXp: nextXp,
          duo: {
            ...prev.duo,
            partnerMomentum: nowAllCompleted
              ? Math.min(100, prev.duo.partnerMomentum + 5)
              : prev.duo.partnerMomentum,
            duoSynergyDays: nowAllCompleted
              ? prev.duo.duoSynergyDays + 1
              : prev.duo.duoSynergyDays,
          },
          duoOperation: {
            ...prev.duoOperation,
            stages: updatedStages,
            completedCount: nowAllCompleted
              ? prev.duoOperation.completedCount + 1
              : prev.duoOperation.completedCount,
          },
        };

        const chargeDelta = nowAllCompleted
          ? MOB_CHARGE_DELTAS.DUO_STAGE + prev.duoOperation.rewardMobCharge
          : MOB_CHARGE_DELTAS.DUO_STAGE;

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: chargeDelta,
            emotionSource: "vinculo",
            triggerAction: nowAllCompleted
              ? `Operación Dúo completada: ${prev.duoOperation.title}`
              : `Etapa Dúo: ${targetStage.title}`,
            stampCandidate: nowAllCompleted
              ? {
                  headline: "OPERACIÓN DÚO COMPLETADA",
                  itemTitle: prev.duoOperation.title,
                  attribute: "energia",
                }
              : undefined,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          duoAction: true,
          mobHundredDetonation: reachedHundred,
        });
      });
    },
    [applyMobChargeAndEffects, checkAndUnlockAchievements]
  );

  const switchDuoOperationTemplate = useCallback(
    (templateId: string) => {
      soundEngine.playTap();
      setState((prev) => ({
        ...prev,
        duoOperation: createDuoOperationFromTemplate(
          templateId,
          prev.duoOperation.completedCount
        ),
      }));
      pushToast(
        "Operación Dúo actualizada",
        "Nuevas etapas listas para coordinar en equipo.",
        "sage"
      );
    },
    [pushToast]
  );

  const sendRespectSalute = useCallback(
    (targetKey: string, targetName: string) => {
      const normalizedTarget = targetKey.startsWith(`${todayKey}:`)
        ? targetKey.slice(todayKey.length + 1)
        : targetKey;
      const saluteKey = `${todayKey}:${normalizedTarget}`;

      if (state.respectSentTodayKeys.includes(saluteKey)) {
        soundEngine.playTap();
        pushToast(
          `Ya saludaste a ${targetName} hoy`,
          "Mañana podrás enviarle un nuevo pulso de respeto.",
          "sage"
        );
        return;
      }

      soundEngine.playMedal("bronze");

      setState((prev) => {
        if (prev.respectSentTodayKeys.includes(saluteKey)) {
          return prev;
        }

        const isDuoTarget = normalizedTarget === "duo";
        const nextDuo = isDuoTarget
          ? {
              ...prev.duo,
              partnerMomentum: Math.min(100, prev.duo.partnerMomentum + 2),
              nudges: [
                {
                  id: `nudge-respect-${Date.now()}`,
                  from: "me" as const,
                  label: RESPECT_SALUTE_MESSAGE,
                  timestamp: new Date().toISOString(),
                },
                ...prev.duo.nudges,
              ].slice(0, 8),
            }
          : prev.duo;

        const nextCrewMembers = isDuoTarget
          ? prev.crewMembers
          : prev.crewMembers.map((member) =>
              member.id === normalizedTarget
                ? {
                    ...member,
                    momentum: Math.min(100, member.momentum + 2),
                    statusLabel: RESPECT_SALUTE_MESSAGE,
                  }
                : member
            );

        const baseDraft: MobState = {
          ...prev,
          momentum: Math.min(100, prev.momentum + 1),
          respectSentTodayKeys: [...prev.respectSentTodayKeys, saluteKey],
          duo: nextDuo,
          crewMembers: nextCrewMembers,
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: MOB_CHARGE_DELTAS.RESPECT_SALUTE,
            emotionSource: "vinculo",
            triggerAction: `Respeto enviado a ${targetName}`,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          duoAction: isDuoTarget,
          mobHundredDetonation: reachedHundred,
        });
      });

      if (normalizedTarget === "duo") {
        if (typeof BroadcastChannel !== "undefined") {
          const bc = new BroadcastChannel("mob-duo-live");
          bc.postMessage({ type: "DUO_NUDGE", label: RESPECT_SALUTE_MESSAGE });
          bc.close();
        }
        if (supabase && state.duo.inviteCode) {
          supabase.channel(`duo-${state.duo.inviteCode}`).send({
            type: "broadcast",
            event: "nudge",
            payload: { label: RESPECT_SALUTE_MESSAGE },
          });
        }
      }

      pushToast(`Respeto enviado a ${targetName}`, RESPECT_SALUTE_MESSAGE, "sage");
    },
    [
      todayKey,
      state.respectSentTodayKeys,
      state.duo.inviteCode,
      applyMobChargeAndEffects,
      checkAndUnlockAchievements,
      pushToast,
    ]
  );

  const completeDayDebrief = useCallback(
    (tomorrowMissionTitle?: string) => {
      soundEngine.playMissionBell();
      const cleanTomorrowTitle = tomorrowMissionTitle?.trim() || "";
      const tomorrowKey = getLocalDateKey(1);

      setState((prev) => {
        const alreadyClosed = prev.closedDayDates.includes(todayKey);
        const nextClosedDates = alreadyClosed
          ? prev.closedDayDates
          : [...prev.closedDayDates, todayKey];

        let nextTasks = prev.tasks;
        if (cleanTomorrowTitle) {
          const tomorrowMainCount = prev.tasks.filter(
            (t) =>
              t.scheduledDate === tomorrowKey &&
              t.isMainMission &&
              !t.completed
          ).length;

          const createdTomorrowTask: TaskItem = {
            id: `task-debrief-${Date.now()}`,
            title: cleanTomorrowTitle,
            scheduledDate: tomorrowKey,
            timeOfDay: "morning",
            isMainMission: tomorrowMainCount < 3,
            primaryAttribute: "enfoque",
            completed: false,
            postponeCount: 0,
            microSteps: [],
          };
          nextTasks = [createdTomorrowTask, ...prev.tasks];
        }

        const nextXp = { ...prev.attributeXp };
        if (!alreadyClosed) {
          nextXp.disciplina += 8;
        }

        const baseDraft: MobState = {
          ...prev,
          momentum: alreadyClosed
            ? prev.momentum
            : Math.min(100, prev.momentum + 3),
          attributeXp: nextXp,
          tasks: nextTasks,
          closedDayDates: nextClosedDates,
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: alreadyClosed ? 0 : MOB_CHARGE_DELTAS.DAY_DEBRIEF,
            emotionSource: "claridad",
            triggerAction: "Cierre consciente del día",
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          mobHundredDetonation: reachedHundred,
        });
      });

      pushToast(
        "Día cerrado en calma",
        cleanTomorrowTitle
          ? "Tu prioridad #1 de mañana ya quedó lista."
          : "Buen cierre. Descansa hoy y sigue sumando mañana.",
        "sage"
      );
    },
    [todayKey, applyMobChargeAndEffects, checkAndUnlockAchievements, pushToast]
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
        const baseDraft: MobState = {
          ...prev,
          momentum: Math.min(100, prev.momentum + 4),
          attributeXp: nextXp,
          bodySnapshots: nextSnapshots,
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: 6,
            emotionSource: "determinacion",
            triggerAction: "Control corporal consciente",
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          bodyCheckin: true,
          mobHundredDetonation: reachedHundred,
        });
      });
      pushToast(
        "Control corporal guardado",
        `${MORPHOLOGICAL_PROFILES[snapshot.morphologicalProfile].label} · WHtR ${snapshot.waistToHeightRatio.toFixed(2)}`,
        "sage"
      );
      return snapshot;
    },
    [applyMobChargeAndEffects, checkAndUnlockAchievements, pushToast]
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

        const exerciseObj = prev.gymExercises.find((e) => e.id === exerciseId);
        const exerciseLabel = exerciseObj?.name || "Ejercicio de fuerza";

        const nextXp = { ...prev.attributeXp };
        nextXp.fuerza += committedEntry.isPr ? 14 : 6;
        nextXp.disciplina += 3;

        const baseDraft: MobState = {
          ...prev,
          momentum: Math.min(
            100,
            prev.momentum + (committedEntry.isPr ? 5 : 2)
          ),
          attributeXp: nextXp,
          gymSets: [...prev.gymSets, committedEntry],
        };

        const { updatedDraft, reachedHundred } = applyMobChargeAndEffects(
          baseDraft,
          {
            delta: committedEntry.isPr
              ? MOB_CHARGE_DELTAS.GYM_PR
              : MOB_CHARGE_DELTAS.GYM_SET,
            emotionSource: committedEntry.isPr ? "coraje" : "determinacion",
            triggerAction: committedEntry.isPr
              ? `Nuevo PR en ${exerciseLabel} (${cleanWeight} kg × ${cleanReps})`
              : `Serie de ${exerciseLabel}`,
            stampCandidate: committedEntry.isPr
              ? {
                  headline: "NUEVO PR DE FUERZA",
                  itemTitle: `${exerciseLabel} · ${cleanWeight} kg × ${cleanReps}`,
                  attribute: "fuerza",
                }
              : undefined,
          }
        );

        return checkAndUnlockAchievements(updatedDraft, {
          mobHundredDetonation: reachedHundred,
        });
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
    [
      todayKey,
      state.gymSets,
      applyMobChargeAndEffects,
      checkAndUnlockAchievements,
      pushToast,
    ]
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

  const shieldActive = useMemo(
    () => isMobShieldActive(state.mobShieldUntil),
    [state.mobShieldUntil]
  );

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
      missionStamp,
      dismissMissionStamp,
      activeHundredMoment,
      acknowledgeHundredMoment,
      shieldActive,
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
      toggleDuoOperationStage,
      switchDuoOperationTemplate,
      sendRespectSalute,
      completeDayDebrief,
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
      missionStamp,
      dismissMissionStamp,
      activeHundredMoment,
      acknowledgeHundredMoment,
      shieldActive,
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
      toggleDuoOperationStage,
      switchDuoOperationTemplate,
      sendRespectSalute,
      completeDayDebrief,
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
