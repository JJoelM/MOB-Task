import {
  BodyMeasurementSnapshot,
  GymSetEntry,
  MorphologicalProfileId,
} from "@/types/mob";

export { buildEvolutionCsv } from "@/lib/csv-export";

const DAY_MS = 86_400_000;

export function calculateUsNavyBodyFat(params: {
  sex: "male" | "female";
  heightCm: number;
  neckCm: number;
  waistCm: number;
  hipCm?: number;
}): number | undefined {
  const { sex, heightCm, neckCm, waistCm, hipCm } = params;

  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(neckCm) ||
    !Number.isFinite(waistCm) ||
    heightCm <= 0 ||
    neckCm <= 0 ||
    waistCm <= 0
  ) {
    return undefined;
  }

  let rawPct: number;

  if (sex === "male") {
    if (waistCm <= neckCm) return undefined;
    const denominator =
      1.0324 -
      0.19077 * Math.log10(waistCm - neckCm) +
      0.15456 * Math.log10(heightCm);
    if (!Number.isFinite(denominator) || denominator <= 0) return undefined;
    rawPct = 495 / denominator - 450;
  } else {
    if (
      hipCm === undefined ||
      !Number.isFinite(hipCm) ||
      hipCm <= 0 ||
      waistCm + hipCm <= neckCm
    ) {
      return undefined;
    }
    const denominator =
      1.29579 -
      0.35004 * Math.log10(waistCm + hipCm - neckCm) +
      0.221 * Math.log10(heightCm);
    if (!Number.isFinite(denominator) || denominator <= 0) return undefined;
    rawPct = 495 / denominator - 450;
  }

  if (!Number.isFinite(rawPct)) return undefined;

  const clamped = Math.min(55, Math.max(4, rawPct));
  return Number(clamped.toFixed(1));
}

export function calculateWaistToHeightRatio(
  waistCm: number,
  heightCm: number
): number {
  if (
    !Number.isFinite(waistCm) ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    waistCm <= 0
  ) {
    return 0;
  }
  return Number((waistCm / heightCm).toFixed(3));
}

export function calculateShoulderToWaistRatio(
  shouldersCm?: number,
  waistCm?: number
): number | undefined {
  if (
    shouldersCm === undefined ||
    waistCm === undefined ||
    !Number.isFinite(shouldersCm) ||
    !Number.isFinite(waistCm) ||
    shouldersCm <= 0 ||
    waistCm <= 0
  ) {
    return undefined;
  }
  return Number((shouldersCm / waistCm).toFixed(2));
}

export const MORPHOLOGICAL_PROFILES: Record<
  MorphologicalProfileId,
  {
    id: MorphologicalProfileId;
    label: string;
    summary: string;
    cadenceHint: string;
  }
> = {
  "athletic-meso": {
    id: "athletic-meso",
    label: "Estructura Atlética-Mesomorfa",
    summary:
      "Buena relación hombro-cintura y tracción muscular sólida con respuesta eficiente al estímulo de fuerza.",
    cadenceHint:
      "Registra tus medidas cada 7 a 14 días en condiciones similares para leer tendencias reales sin ruido diario.",
  },
  "lean-agile": {
    id: "lean-agile",
    label: "Estructura Esbelta-Ágil",
    summary:
      "Líneas ligeras y cintura compacta con alta agilidad relativa y margen limpio para construir masa funcional.",
    cadenceHint:
      "Un chequeo tranquilo cada 10 a 14 días basta; prioriza progresión de cargas, sueño y energía sostenida.",
  },
  "power-enduro": {
    id: "power-enduro",
    label: "Estructura Fuerte de Potencia",
    summary:
      "Base estructural firme de gran estabilidad y empuje mecánico, ideal para mover cargas y recomponer gradualmente.",
    cadenceHint:
      "Revisa tu evolución cada 7 a 14 días enfocándote en cintura-estatura y ganancias de fuerza, sin prisas.",
  },
  balanced: {
    id: "balanced",
    label: "Estructura Equilibrada",
    summary:
      "Proporciones armónicas y versátiles con buena adaptación tanto a sesiones de fuerza como de resistencia.",
    cadenceHint:
      "Haz un control consciente cada 7 a 14 días para acompañar tus hábitos sin caer en perfeccionismo.",
  },
};

export function classifyMorphologicalProfile(params: {
  sex: "male" | "female";
  bodyFatPct?: number;
  waistToHeightRatio: number;
  shoulderToWaistRatio?: number;
}): MorphologicalProfileId {
  const { sex, bodyFatPct, waistToHeightRatio, shoulderToWaistRatio } = params;

  if (sex === "male") {
    if (
      waistToHeightRatio >= 0.53 ||
      (bodyFatPct !== undefined && bodyFatPct >= 23)
    ) {
      return "power-enduro";
    }
    if (
      shoulderToWaistRatio !== undefined &&
      shoulderToWaistRatio >= 1.38 &&
      waistToHeightRatio <= 0.5 &&
      (bodyFatPct === undefined || bodyFatPct <= 20)
    ) {
      return "athletic-meso";
    }
    if (
      waistToHeightRatio > 0 &&
      waistToHeightRatio < 0.44 &&
      (bodyFatPct === undefined || bodyFatPct <= 14)
    ) {
      return "lean-agile";
    }
    return "balanced";
  }

  if (
    waistToHeightRatio >= 0.53 ||
    (bodyFatPct !== undefined && bodyFatPct >= 31)
  ) {
    return "power-enduro";
  }
  if (
    shoulderToWaistRatio !== undefined &&
    shoulderToWaistRatio >= 1.28 &&
    waistToHeightRatio <= 0.49 &&
    (bodyFatPct === undefined || bodyFatPct <= 27)
  ) {
    return "athletic-meso";
  }
  if (
    waistToHeightRatio > 0 &&
    waistToHeightRatio < 0.43 &&
    (bodyFatPct === undefined || bodyFatPct <= 22)
  ) {
    return "lean-agile";
  }
  return "balanced";
}

export function buildBodySnapshot(
  input: Omit<
    BodyMeasurementSnapshot,
    | "id"
    | "estimatedBodyFatPct"
    | "waistToHeightRatio"
    | "shoulderToWaistRatio"
    | "morphologicalProfile"
  > & { id?: string }
): BodyMeasurementSnapshot {
  const estimatedBodyFatPct = calculateUsNavyBodyFat({
    sex: input.sex,
    heightCm: input.heightCm,
    neckCm: input.neckCm,
    waistCm: input.waistCm,
    hipCm: input.hipCm,
  });
  const waistToHeightRatio = calculateWaistToHeightRatio(
    input.waistCm,
    input.heightCm
  );
  const shoulderToWaistRatio = calculateShoulderToWaistRatio(
    input.shouldersCm,
    input.waistCm
  );
  const morphologicalProfile = classifyMorphologicalProfile({
    sex: input.sex,
    bodyFatPct: estimatedBodyFatPct,
    waistToHeightRatio,
    shoulderToWaistRatio,
  });

  return {
    ...input,
    id:
      input.id ??
      `body-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    estimatedBodyFatPct,
    waistToHeightRatio,
    shoulderToWaistRatio,
    morphologicalProfile,
  };
}

export function calculateEpley1Rm(weightKg: number, reps: number): number {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(reps) ||
    weightKg <= 0 ||
    reps <= 0
  ) {
    return 0;
  }
  if (reps === 1) {
    return Number(weightKg.toFixed(1));
  }
  return Number((weightKg * (1 + reps / 30)).toFixed(1));
}

export function calculateSetVolume(weightKg: number, reps: number): number {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(reps) ||
    weightKg <= 0 ||
    reps <= 0
  ) {
    return 0;
  }
  return Number((weightKg * reps).toFixed(1));
}

export function isNewPersonalRecord(
  new1Rm: number,
  previousSetsForExercise: Pick<GymSetEntry, "estimated1RmKg">[]
): boolean {
  if (!Number.isFinite(new1Rm) || new1Rm <= 0) return false;
  return (
    previousSetsForExercise.length > 0 &&
    new1Rm > Math.max(...previousSetsForExercise.map((s) => s.estimated1RmKg))
  );
}

export function computeSeriesWithDeltas<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number
): Array<{
  item: T;
  date: string;
  value: number;
  deltaFromPrev: number | null;
  deltaFromFirst: number;
}> {
  if (items.length === 0) return [];

  const sorted = [...items]
    .map((item) => ({
      item,
      date: getDate(item),
      value: getValue(item),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const firstValue = sorted[0].value;

  return sorted.map((entry, idx) => {
    const deltaFromPrev =
      idx === 0 ? null : Number((entry.value - sorted[idx - 1].value).toFixed(2));
    const deltaFromFirst = Number((entry.value - firstValue).toFixed(2));
    return {
      item: entry.item,
      date: entry.date,
      value: entry.value,
      deltaFromPrev,
      deltaFromFirst,
    };
  });
}

function parseDateKeyUtcMs(dateKey: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return Date.UTC(year, month - 1, day);
}

export function filterByDayWindow<T>(
  items: T[],
  getDate: (item: T) => string,
  referenceDate: string,
  days: number | "all"
): T[] {
  if (days === "all") return [...items];
  if (!Number.isFinite(days) || days < 0) return [];

  const refMs = parseDateKeyUtcMs(referenceDate);
  if (refMs === null) return [];

  const minMs = refMs - days * DAY_MS;

  return items.filter((item) => {
    const itemMs = parseDateKeyUtcMs(getDate(item));
    if (itemMs === null) return false;
    return itemMs >= minMs && itemMs <= refMs;
  });
}
