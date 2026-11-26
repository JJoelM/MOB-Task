import { GymMuscleGroup, GymSetEntry } from "@/types/mob";

export const MUSCLE_GROUP_META: Record<
  GymMuscleGroup,
  { label: string; shortHint: string }
> = {
  push: {
    label: "Empuje",
    shortHint: "Pecho, hombro y tríceps",
  },
  pull: {
    label: "Tirón",
    shortHint: "Espalda, dorsal y bíceps",
  },
  legs: {
    label: "Pierna",
    shortHint: "Cuádriceps, isquios y glúteo",
  },
  core: {
    label: "Core",
    shortHint: "Abdomen y estabilidad media",
  },
};

export interface GymQuickPack {
  id: string;
  label: string;
  shortHint: string;
  muscleGroup: GymMuscleGroup;
  exerciseIds: string[];
}

export const GYM_QUICK_PACKS: GymQuickPack[] = [
  {
    id: "pack-push",
    label: "Empuje (Pecho/Hombro)",
    shortHint: "Banca + Militar sin configurar rutina",
    muscleGroup: "push",
    exerciseIds: ["ex-bench", "ex-ohp"],
  },
  {
    id: "pack-pull",
    label: "Tirón (Espalda/Bíceps)",
    shortHint: "Dominadas, Remo y Curl listos",
    muscleGroup: "pull",
    exerciseIds: ["ex-pullup", "ex-row", "ex-curl"],
  },
  {
    id: "pack-legs",
    label: "Pierna y Glúteo",
    shortHint: "Sentadilla, Rumano y Hip Thrust",
    muscleGroup: "legs",
    exerciseIds: ["ex-squat", "ex-rdl", "ex-hip"],
  },
];

export function getExerciseBestAndLast(
  sets: GymSetEntry[],
  exerciseId: string
): {
  lastSet?: GymSetEntry;
  best1RmSet?: GymSetEntry;
  totalSetsCount: number;
} {
  const matching = sets.filter((s) => s.exerciseId === exerciseId);
  if (matching.length === 0) {
    return {
      lastSet: undefined,
      best1RmSet: undefined,
      totalSetsCount: 0,
    };
  }

  const chronological = matching
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const dateCmp = a.entry.date.localeCompare(b.entry.date);
      if (dateCmp !== 0) return dateCmp;
      const tsCmp = (a.entry.timestamp || "").localeCompare(
        b.entry.timestamp || ""
      );
      if (tsCmp !== 0) return tsCmp;
      return a.index - b.index;
    })
    .map((item) => item.entry);

  const lastSet = chronological[chronological.length - 1];

  let best1RmSet = chronological[0];
  for (const current of chronological) {
    if (current.estimated1RmKg > best1RmSet.estimated1RmKg) {
      best1RmSet = current;
    }
  }

  return {
    lastSet,
    best1RmSet,
    totalSetsCount: chronological.length,
  };
}
