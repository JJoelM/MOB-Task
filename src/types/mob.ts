export const APP_NAME = "MOB";

export type AttributeKey = "energia" | "fuerza" | "enfoque" | "disciplina";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export type MedalTier = "bronze" | "silver" | "gold";

export type NavSection = "today" | "plan" | "progress" | "bonds";

export type ProgressSubTab = "hud" | "gym" | "body" | "stats";

export type MeasurementZone =
  | "neck"
  | "waist"
  | "hip"
  | "shoulders"
  | "chest"
  | "biceps"
  | "thigh"
  | "calf";

export type MeasurementMode = "solo" | "assisted";

export type MorphologicalProfileId =
  | "athletic-meso"
  | "lean-agile"
  | "power-enduro"
  | "balanced";

export interface BodyMeasurementSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  shouldersCm?: number;
  chestCm?: number;
  bicepsCm?: number;
  thighCm?: number;
  calfCm?: number;
  estimatedBodyFatPct?: number;
  waistToHeightRatio: number;
  shoulderToWaistRatio?: number;
  morphologicalProfile: MorphologicalProfileId;
  modeUsed: MeasurementMode;
  notes?: string;
}

export type GymMuscleGroup = "push" | "pull" | "legs" | "core";

export interface GymExercise {
  id: string;
  name: string;
  muscleGroup: GymMuscleGroup;
  isCompound?: boolean;
}

export interface GymSetEntry {
  id: string;
  exerciseId: string;
  date: string;
  weightKg: number;
  reps: number;
  estimated1RmKg: number;
  volumeKg: number;
  isPr: boolean;
  timestamp: string;
}

export interface HabitTierSpec {
  label: string;
  minutes: number;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  timeOfDay: TimeOfDay;
  primaryAttribute: AttributeKey;
  secondaryAttribute?: AttributeKey;
  tiers: {
    bronze: HabitTierSpec;
    silver: HabitTierSpec;
    gold: HabitTierSpec;
  };
  isSharedDuo: boolean;
  activeDays: number[]; // 0 (Dom) - 6 (Sáb)
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD local
  tier: MedalTier;
  minutesLogged: number;
  completedWithDuo?: boolean;
  timestamp: string;
}

export interface MicroStep {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  scheduledDate: string; // YYYY-MM-DD local
  timeOfDay: TimeOfDay;
  optionalTime?: string; // HH:MM
  isMainMission: boolean;
  primaryAttribute: AttributeKey;
  completed: boolean;
  completedTier?: MedalTier;
  completedAt?: string;
  postponeCount: number;
  microSteps: MicroStep[];
  duoSosActive?: boolean;
}

export interface FlashEvent {
  id: string;
  title: string;
  actionHint: string;
  durationMinutes: number;
  attribute: AttributeKey;
  momentumBoost: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: MedalTier;
  category: "momentum" | "focus" | "body" | "duo";
  unlockedAt?: string;
}

export interface DuoNudge {
  id: string;
  from: "me" | "partner";
  label: string;
  timestamp: string;
}

export interface DuoState {
  connected: boolean;
  inviteCode: string;
  partnerName: string;
  partnerMomentum: number;
  partnerTodayPct: number;
  partnerMainMissionDone: boolean;
  partnerCompletedSharedHabitIds: string[];
  duoSynergyDays: number;
  activeSosTaskId?: string;
  nudges: DuoNudge[];
}

export interface CrewMember {
  id: string;
  name: string;
  initials: string;
  momentum: number;
  todayPct: number;
  medalsThisWeek: {
    bronze: number;
    silver: number;
    gold: number;
  };
  statusLabel: string;
}

export interface CrewChallenge {
  id: string;
  title: string;
  subtitle: string;
  targetMedals: number;
  currentMedals: number;
  daysRemaining: number;
}

export interface ActiveMissionSession {
  type: "habit" | "task" | "flash";
  itemId: string;
  title: string;
  targetMinutes: number;
  tierTarget?: MedalTier;
  isCoopDuo?: boolean;
  attribute: AttributeKey;
}

export interface ToastNotice {
  id: string;
  title: string;
  subtitle?: string;
  tone: "sage" | "action" | "gold";
}

export type MobEmotionId = "determinacion" | "coraje" | "vinculo" | "claridad";

export interface MobHundredMoment {
  id: string;
  emotion: MobEmotionId;
  title: string; // e.g. "100% Determinación"
  subtitle: string;
  triggerAction: string;
  unlockedAt: string; // ISO
  shieldExpiresAt: string; // ISO (+24h)
}

export interface MissionPassedStamp {
  id: string;
  headline: string; // e.g. "MISIÓN SUPERADA" | "NUEVO PR DE FUERZA" | "OPERACIÓN DÚO COMPLETADA"
  itemTitle: string;
  fromCharge: number;
  toCharge: number;
  attribute?: AttributeKey;
}

export interface DuoOperationStage {
  id: string;
  owner: "me" | "partner";
  title: string;
  hint: string;
  completed: boolean;
}

export interface DuoOperationState {
  templateId: string;
  title: string;
  subtitle: string;
  durationDays: number;
  rewardMobCharge: number;
  stages: DuoOperationStage[];
  completedCount: number; // total operations finished historically
}

export interface MobState {
  onboarded: boolean;
  userName: string;
  momentum: number; // 0 - 100 (Inercia no punitiva)
  mobCharge: number; // 0..99, seeded at 82
  mobCycleSources: Record<MobEmotionId, number>;
  mobShieldUntil?: string;
  mobHundredMoments: MobHundredMoment[];
  duoOperation: DuoOperationState;
  closedDayDates: string[]; // YYYY-MM-DD
  respectSentTodayKeys: string[]; // e.g. `${todayKey}:duo` or `${todayKey}:crew-1`
  attributeXp: Record<AttributeKey, number>;
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: TaskItem[];
  unlockedAchievementIds: Record<string, string>; // id -> ISO timestamp
  dismissedFlashDate?: string;
  completedFlashDates: string[];
  duo: DuoState;
  crewName: string;
  crewMembers: CrewMember[];
  crewChallenge: CrewChallenge;
  soundEnabled: boolean;
  bodySnapshots: BodyMeasurementSnapshot[];
  gymExercises: GymExercise[];
  gymSets: GymSetEntry[];
}

/* ============================================================================
 * FASE 2 (Preparado sin deuda técnica): Antropometría US Navy, USDA/OFF y Health
 * ============================================================================ */
export interface BodyMetricsPhase2 {
  measuredAt: string;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
  estimatedBodyFatNavyPct?: number;
  waistToHeightRatio?: number;
  morphologicalTendency?: "ectomorphic" | "mesomorphic" | "endomorphic" | "balanced-hybrid";
}

export interface NutritionItemPhase2 {
  source: "usda_fdc" | "open_food_facts";
  externalId: string;
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface HealthConnectSyncPhase2 {
  provider: "google_health_connect";
  connectedViaCapacitor: boolean;
  lastSyncedAt?: string;
  stepsToday?: number;
  activeMinutesToday?: number;
}
