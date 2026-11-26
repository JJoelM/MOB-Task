import { describe, expect, it } from "vitest";
import { GymMuscleGroup, GymSetEntry } from "@/types/mob";
import {
  getExerciseBestAndLast,
  GYM_QUICK_PACKS,
  MUSCLE_GROUP_META,
} from "@/lib/gym-templates";

function makeSet(
  overrides: Partial<GymSetEntry> & Pick<GymSetEntry, "id" | "exerciseId">
): GymSetEntry {
  return {
    date: "2026-11-20",
    weightKg: 60,
    reps: 8,
    estimated1RmKg: 76,
    volumeKg: 480,
    isPr: false,
    timestamp: "2026-11-20T18:00:00.000Z",
    ...overrides,
  };
}

describe("Gym Templates & Muscle Metadata", () => {
  it("exposes Spanish labels and hints for all 4 GymMuscleGroup keys", () => {
    const groups: GymMuscleGroup[] = ["push", "pull", "legs", "core"];
    expect(Object.keys(MUSCLE_GROUP_META).sort()).toEqual([...groups].sort());
    expect(MUSCLE_GROUP_META.push.label).toBe("Empuje");
    expect(MUSCLE_GROUP_META.pull.label).toBe("Tirón");
    expect(MUSCLE_GROUP_META.legs.label).toBe("Pierna");
    expect(MUSCLE_GROUP_META.core.label).toBe("Core");

    for (const key of groups) {
      expect(MUSCLE_GROUP_META[key].shortHint.length).toBeGreaterThan(4);
    }
  });

  it("provides lightweight GYM_QUICK_PACKS covering all 8 default exercise IDs", () => {
    expect(GYM_QUICK_PACKS.map((p) => p.label)).toEqual([
      "Empuje (Pecho/Hombro)",
      "Tirón (Espalda/Bíceps)",
      "Pierna y Glúteo",
    ]);

    const allReferencedIds = GYM_QUICK_PACKS.flatMap((p) => p.exerciseIds);
    expect(allReferencedIds.sort()).toEqual(
      [
        "ex-bench",
        "ex-ohp",
        "ex-pullup",
        "ex-row",
        "ex-curl",
        "ex-squat",
        "ex-rdl",
        "ex-hip",
      ].sort()
    );
  });
});

describe("getExerciseBestAndLast", () => {
  it("returns undefined lastSet and best1RmSet with totalSetsCount 0 when no sets match", () => {
    const otherSet = makeSet({ id: "s1", exerciseId: "ex-squat" });
    expect(getExerciseBestAndLast([], "ex-bench")).toEqual({
      lastSet: undefined,
      best1RmSet: undefined,
      totalSetsCount: 0,
    });
    expect(getExerciseBestAndLast([otherSet], "ex-bench")).toEqual({
      lastSet: undefined,
      best1RmSet: undefined,
      totalSetsCount: 0,
    });
  });

  it("identifies chronological lastSet and highest estimated1RmKg best1RmSet across multiple dates", () => {
    const sets: GymSetEntry[] = [
      // Latest chronological date, moderate deload weight
      makeSet({
        id: "set-latest",
        exerciseId: "ex-bench",
        date: "2026-11-25",
        weightKg: 60,
        reps: 8,
        estimated1RmKg: 76,
        timestamp: "2026-11-25T19:00:00.000Z",
      }),
      // Earlier date, all-time peak 1RM
      makeSet({
        id: "set-peak-pr",
        exerciseId: "ex-bench",
        date: "2026-11-12",
        weightKg: 72.5,
        reps: 6,
        estimated1RmKg: 87,
        isPr: true,
        timestamp: "2026-11-12T18:30:00.000Z",
      }),
      // Oldest date
      makeSet({
        id: "set-oldest",
        exerciseId: "ex-bench",
        date: "2026-11-01",
        weightKg: 62.5,
        reps: 8,
        estimated1RmKg: 79.2,
        timestamp: "2026-11-01T18:00:00.000Z",
      }),
      // Different exercise (higher 1RM, must be ignored)
      makeSet({
        id: "set-squat",
        exerciseId: "ex-squat",
        date: "2026-11-26",
        weightKg: 110,
        reps: 5,
        estimated1RmKg: 128.3,
        timestamp: "2026-11-26T18:00:00.000Z",
      }),
    ];

    const summary = getExerciseBestAndLast(sets, "ex-bench");
    expect(summary.totalSetsCount).toBe(3);
    expect(summary.lastSet?.id).toBe("set-latest");
    expect(summary.best1RmSet?.id).toBe("set-peak-pr");
    expect(summary.best1RmSet?.estimated1RmKg).toBe(87);
  });

  it("breaks same-day ties using timestamp and array order", () => {
    const sameDaySets: GymSetEntry[] = [
      makeSet({
        id: "set-1",
        exerciseId: "ex-row",
        date: "2026-11-26",
        weightKg: 60,
        reps: 10,
        estimated1RmKg: 80,
        timestamp: "2026-11-26T18:01:00.000Z",
      }),
      makeSet({
        id: "set-2",
        exerciseId: "ex-row",
        date: "2026-11-26",
        weightKg: 62.5,
        reps: 10,
        estimated1RmKg: 83.3,
        timestamp: "2026-11-26T18:05:00.000Z",
      }),
    ];

    const summary = getExerciseBestAndLast(sameDaySets, "ex-row");
    expect(summary.totalSetsCount).toBe(2);
    expect(summary.lastSet?.id).toBe("set-2");
    expect(summary.best1RmSet?.id).toBe("set-2");
  });
});
