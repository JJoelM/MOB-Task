import {
  DuoOperationState,
  MobEmotionId,
  MobHundredMoment,
} from "@/types/mob";

export const MOB_CHARGE_DELTAS = {
  HABIT_BRONZE: 4,
  HABIT_SILVER: 6,
  HABIT_GOLD: 9,
  MAIN_MISSION: 10,
  SECONDARY_TASK: 5,
  FLASH_EVENT: 5,
  ANTI_PROCRASTINATION: 8,
  GYM_SET: 3,
  GYM_PR: 9,
  DUO_STAGE: 7,
  DUO_OPERATION_BONUS: 12,
  RESPECT_SALUTE: 2,
  DAY_DEBRIEF: 4,
} as const;

export const MOB_EMOTION_META: Record<
  MobEmotionId,
  { id: MobEmotionId; title: string; subtitle: string; boostSummary: string }
> = {
  determinacion: {
    id: "determinacion",
    title: "100% Determinación",
    subtitle:
      "Sostuviste el piso día tras día hasta desbordar el medidor. La constancia tranquila le ganó al todo-o-nada.",
    boostSummary:
      "Escudo de Inercia activo 24h · +5% impulso a tu Dúo · +2 medallas a la Crew",
  },
  coraje: {
    id: "coraje",
    title: "100% Coraje",
    subtitle:
      "Avanzaste justo donde había fricción. Empezar en pequeño desarmó la resistencia.",
    boostSummary:
      "Escudo de Inercia activo 24h · +5% impulso a tu Dúo · +2 medallas a la Crew",
  },
  vinculo: {
    id: "vinculo",
    title: "100% Vínculo",
    subtitle:
      "El esfuerzo compartido multiplica el ritmo. Tu empuje levantó tanto tu día como el de tu equipo.",
    boostSummary:
      "Escudo de Inercia activo 24h · +5% impulso a tu Dúo · +2 medallas a la Crew",
  },
  claridad: {
    id: "claridad",
    title: "100% Claridad",
    subtitle:
      "Separaste el ruido de lo esencial y cerraste tus prioridades con foco limpio.",
    boostSummary:
      "Escudo de Inercia activo 24h · +5% impulso a tu Dúo · +2 medallas a la Crew",
  },
};

export interface DuoOperationTemplate {
  id: string;
  title: string;
  subtitle: string;
  durationDays: number;
  rewardMobCharge: number;
  stages: Array<{
    id: string;
    owner: "me" | "partner";
    title: string;
    hint: string;
  }>;
}

export const DUO_OPERATION_TEMPLATES: DuoOperationTemplate[] = [
  {
    id: "op-doble-turno",
    title: "Operación Doble Turno",
    subtitle:
      "Relevo táctico de 24h: uno abre camino temprano y el otro asegura el cierre sin fisuras.",
    durationDays: 1,
    rewardMobCharge: MOB_CHARGE_DELTAS.DUO_OPERATION_BONUS,
    stages: [
      {
        id: "dt-stage-1",
        owner: "partner",
        title: "Abrir brecha de mañana",
        hint: "Tu Dúo activa el primer hábito o prioridad antes del mediodía.",
      },
      {
        id: "dt-stage-2",
        owner: "me",
        title: "Asegurar Misión Principal",
        hint: "Completa tu prioridad #1 del día sin posponerla.",
      },
      {
        id: "dt-stage-3",
        owner: "partner",
        title: "Sostener relevo de tarde",
        hint: "Tu Dúo suma una medalla Plata u Oro a la jornada.",
      },
      {
        id: "dt-stage-4",
        owner: "me",
        title: "Sellar el turno nocturno",
        hint: "Cierra un hábito de orden, lectura o el balance del día.",
      },
    ],
  },
  {
    id: "op-constancia-48h",
    title: "Golpe Cero Excusas 48h",
    subtitle:
      "Dos días seguidos asegurando al menos el piso mínimo y limpiando pendientes trabados.",
    durationDays: 2,
    rewardMobCharge: MOB_CHARGE_DELTAS.DUO_OPERATION_BONUS,
    stages: [
      {
        id: "ce-stage-1",
        owner: "me",
        title: "Romper el hielo en 2 minutos",
        hint: "Desbloquea una tarea con micro-pasos o asegura un Bronce rápido.",
      },
      {
        id: "ce-stage-2",
        owner: "partner",
        title: "Cubrir el flanco compartido",
        hint: "Tu Dúo completa su misión clave del primer día.",
      },
      {
        id: "ce-stage-3",
        owner: "me",
        title: "Mantener racha al día siguiente",
        hint: "Suma al menos dos acciones reales sin dejar huecos en cero.",
      },
      {
        id: "ce-stage-4",
        owner: "partner",
        title: "Confirmar extracción 48h",
        hint: "Tu Dúo valida el cierre conjunto del segundo día.",
      },
    ],
  },
  {
    id: "op-cuerpo-mente",
    title: "Sincronía Cuerpo y Mente",
    subtitle:
      "Equilibrio de 3 días combinando entrenamiento físico, foco profundo y desconexión real.",
    durationDays: 3,
    rewardMobCharge: MOB_CHARGE_DELTAS.DUO_OPERATION_BONUS,
    stages: [
      {
        id: "cm-stage-1",
        owner: "me",
        title: "Sesión de fuerza o movimiento",
        hint: "Registra series en Gym o completa un hábito físico.",
      },
      {
        id: "cm-stage-2",
        owner: "partner",
        title: "Pulso activo en paralelo",
        hint: "Tu Dúo completa su entrenamiento o caminata energética.",
      },
      {
        id: "cm-stage-3",
        owner: "me",
        title: "Bloque de foco sin pantallas",
        hint: "Termina un bloque profundo de estudio, lectura o trabajo clave.",
      },
    ],
  },
];

export function createDuoOperationFromTemplate(
  templateId: string,
  completedCount = 0
): DuoOperationState {
  const tpl =
    DUO_OPERATION_TEMPLATES.find((t) => t.id === templateId) ??
    DUO_OPERATION_TEMPLATES[0];

  return {
    templateId: tpl.id,
    title: tpl.title,
    subtitle: tpl.subtitle,
    durationDays: tpl.durationDays,
    rewardMobCharge: tpl.rewardMobCharge,
    stages: tpl.stages.map((s) => ({
      id: s.id,
      owner: s.owner,
      title: s.title,
      hint: s.hint,
      completed: false,
    })),
    completedCount: Math.max(0, Math.floor(completedCount)),
  };
}

export function isMobShieldActive(
  mobShieldUntil: string | undefined,
  nowIso?: string
): boolean {
  if (!mobShieldUntil) return false;
  const untilMs = Date.parse(mobShieldUntil);
  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();
  if (Number.isNaN(untilMs) || Number.isNaN(nowMs)) return false;
  return nowMs < untilMs;
}

const EMOTION_ORDER: MobEmotionId[] = [
  "determinacion",
  "coraje",
  "vinculo",
  "claridad",
];

export function resolveDominantEmotion(
  sources: Record<MobEmotionId, number>,
  fallback: MobEmotionId = "determinacion"
): MobEmotionId {
  let maxVal = 0;
  for (const key of EMOTION_ORDER) {
    const val = Number(sources[key]) || 0;
    if (val > maxVal) {
      maxVal = val;
    }
  }

  if (maxVal <= 0) {
    return fallback;
  }

  if ((Number(sources[fallback]) || 0) === maxVal) {
    return fallback;
  }

  for (const key of EMOTION_ORDER) {
    if ((Number(sources[key]) || 0) === maxVal) {
      return key;
    }
  }

  return fallback;
}

export function advanceMobCharge(params: {
  currentCharge: number;
  cycleSources: Record<MobEmotionId, number>;
  delta: number;
  emotionSource: MobEmotionId;
  triggerAction: string;
  nowIso?: string;
}): {
  nextCharge: number;
  nextSources: Record<MobEmotionId, number>;
  reachedHundred: boolean;
  moment?: MobHundredMoment;
  nextShieldUntil?: string;
} {
  const safeCurrent = Math.max(0, Math.min(99, Math.round(params.currentCharge || 0)));
  const cleanDelta = Math.round(params.delta || 0);

  const baseSources: Record<MobEmotionId, number> = {
    determinacion: Math.max(0, Number(params.cycleSources?.determinacion) || 0),
    coraje: Math.max(0, Number(params.cycleSources?.coraje) || 0),
    vinculo: Math.max(0, Number(params.cycleSources?.vinculo) || 0),
    claridad: Math.max(0, Number(params.cycleSources?.claridad) || 0),
  };

  if (cleanDelta <= 0) {
    return {
      nextCharge: safeCurrent,
      nextSources: baseSources,
      reachedHundred: false,
    };
  }

  const updatedSources: Record<MobEmotionId, number> = {
    ...baseSources,
    [params.emotionSource]: baseSources[params.emotionSource] + cleanDelta,
  };

  const rawTotal = safeCurrent + cleanDelta;

  if (rawTotal >= 100) {
    const nowDate = params.nowIso ? new Date(params.nowIso) : new Date();
    const validNow = Number.isNaN(nowDate.getTime()) ? new Date() : nowDate;
    const unlockedAt = validNow.toISOString();
    const shieldExpiresAt = new Date(
      validNow.getTime() + 24 * 60 * 60 * 1000
    ).toISOString();

    const dominant = resolveDominantEmotion(updatedSources, params.emotionSource);
    const meta = MOB_EMOTION_META[dominant];

    const moment: MobHundredMoment = {
      id: `mob100-${validNow.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
      emotion: dominant,
      title: meta.title,
      subtitle: meta.subtitle,
      triggerAction: params.triggerAction,
      unlockedAt,
      shieldExpiresAt,
    };

    return {
      nextCharge: Math.min(25, rawTotal - 100),
      nextSources: {
        determinacion: 0,
        coraje: 0,
        vinculo: 0,
        claridad: 0,
      },
      reachedHundred: true,
      moment,
      nextShieldUntil: shieldExpiresAt,
    };
  }

  return {
    nextCharge: rawTotal,
    nextSources: updatedSources,
    reachedHundred: false,
  };
}
