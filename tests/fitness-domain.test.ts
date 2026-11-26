import { describe, expect, it } from "vitest";
import {
  buildBodySnapshot,
  calculateEpley1Rm,
  calculateSetVolume,
  calculateShoulderToWaistRatio,
  calculateUsNavyBodyFat,
  calculateWaistToHeightRatio,
  classifyMorphologicalProfile,
  computeSeriesWithDeltas,
  filterByDayWindow,
  isNewPersonalRecord,
  MORPHOLOGICAL_PROFILES,
} from "@/lib/fitness-domain";

describe("US Navy Body Fat & Anthropometric Ratios", () => {
  it("calculates realistic male body fat % accurately using US Navy formula", () => {
    const bf = calculateUsNavyBodyFat({
      sex: "male",
      heightCm: 178,
      neckCm: 38.5,
      waistCm: 84,
    });
    expect(bf).toBeDefined();
    expect(bf).toBeGreaterThan(13);
    expect(bf).toBeLessThan(18);
  });

  it("calculates realistic female body fat % accurately when hipCm is provided", () => {
    const bf = calculateUsNavyBodyFat({
      sex: "female",
      heightCm: 165,
      neckCm: 32.5,
      waistCm: 71,
      hipCm: 96,
    });
    expect(bf).toBeDefined();
    expect(bf).toBeGreaterThan(20);
    expect(bf).toBeLessThan(28);
  });

  it("returns undefined for female when hipCm is missing or invalid", () => {
    expect(
      calculateUsNavyBodyFat({
        sex: "female",
        heightCm: 165,
        neckCm: 33,
        waistCm: 72,
      })
    ).toBeUndefined();

    expect(
      calculateUsNavyBodyFat({
        sex: "female",
        heightCm: 165,
        neckCm: 80,
        waistCm: 40,
        hipCm: 35,
      })
    ).toBeUndefined();
  });

  it("returns undefined when waistCm <= neckCm for male or non-positive dimensions", () => {
    expect(
      calculateUsNavyBodyFat({
        sex: "male",
        heightCm: 180,
        neckCm: 40,
        waistCm: 40,
      })
    ).toBeUndefined();

    expect(
      calculateUsNavyBodyFat({
        sex: "male",
        heightCm: 0,
        neckCm: 38,
        waistCm: 82,
      })
    ).toBeUndefined();
  });

  it("clamps extreme US Navy outputs to [4, 55] rounded to 1 decimal", () => {
    const lowClamp = calculateUsNavyBodyFat({
      sex: "male",
      heightCm: 205,
      neckCm: 44,
      waistCm: 62,
    });
    expect(lowClamp).toBe(4);

    const highClamp = calculateUsNavyBodyFat({
      sex: "male",
      heightCm: 155,
      neckCm: 32,
      waistCm: 165,
    });
    expect(highClamp).toBe(55);
  });

  it("calculates waist-to-height ratio to 3 decimals and handles zero height", () => {
    expect(calculateWaistToHeightRatio(83, 178)).toBe(0.466);
    expect(calculateWaistToHeightRatio(80, 0)).toBe(0);
    expect(calculateWaistToHeightRatio(-75, 175)).toBe(0);
  });

  it("calculates shoulder-to-waist ratio to 2 decimals or undefined if missing/invalid", () => {
    expect(calculateShoulderToWaistRatio(115.5, 83)).toBe(1.39);
    expect(calculateShoulderToWaistRatio(undefined, 83)).toBeUndefined();
    expect(calculateShoulderToWaistRatio(115, 0)).toBeUndefined();
  });
});

describe("Morphological Profiles & Snapshot Builder", () => {
  it("exposes all 4 Spanish SDT-positive morphological profile descriptions with 7-14 day guidance", () => {
    expect(MORPHOLOGICAL_PROFILES["athletic-meso"].label).toBe(
      "Estructura Atlética-Mesomorfa"
    );
    expect(MORPHOLOGICAL_PROFILES["lean-agile"].label).toBe(
      "Estructura Esbelta-Ágil"
    );
    expect(MORPHOLOGICAL_PROFILES["power-enduro"].label).toBe(
      "Estructura Fuerte de Potencia"
    );
    expect(MORPHOLOGICAL_PROFILES.balanced.label).toBe(
      "Estructura Equilibrada"
    );
    for (const profile of Object.values(MORPHOLOGICAL_PROFILES)) {
      expect(profile.cadenceHint).toMatch(/14 días/);
    }
  });

  it("classifies athletic-meso, lean-agile, power-enduro, and balanced profiles", () => {
    expect(
      classifyMorphologicalProfile({
        sex: "male",
        bodyFatPct: 14.5,
        waistToHeightRatio: 0.46,
        shoulderToWaistRatio: 1.41,
      })
    ).toBe("athletic-meso");

    expect(
      classifyMorphologicalProfile({
        sex: "male",
        bodyFatPct: 11.5,
        waistToHeightRatio: 0.41,
        shoulderToWaistRatio: 1.29,
      })
    ).toBe("lean-agile");

    expect(
      classifyMorphologicalProfile({
        sex: "male",
        bodyFatPct: 25.2,
        waistToHeightRatio: 0.55,
        shoulderToWaistRatio: 1.22,
      })
    ).toBe("power-enduro");

    expect(
      classifyMorphologicalProfile({
        sex: "female",
        bodyFatPct: 24.0,
        waistToHeightRatio: 0.46,
        shoulderToWaistRatio: 1.21,
      })
    ).toBe("balanced");
  });

  it("builds a complete BodyMeasurementSnapshot with derived metrics and custom or generated id", () => {
    const snap = buildBodySnapshot({
      id: "snap-test-1",
      date: "2026-11-20",
      sex: "male",
      heightCm: 178,
      weightKg: 77.3,
      neckCm: 38.6,
      waistCm: 83.0,
      shouldersCm: 115.5,
      bicepsCm: 35.8,
      modeUsed: "assisted",
      notes: "Control quincenal",
    });

    expect(snap.id).toBe("snap-test-1");
    expect(snap.waistToHeightRatio).toBe(0.466);
    expect(snap.shoulderToWaistRatio).toBe(1.39);
    expect(snap.estimatedBodyFatPct).toBeDefined();
    expect(snap.morphologicalProfile).toBe("athletic-meso");

    const autoIdSnap = buildBodySnapshot({
      date: "2026-11-21",
      sex: "male",
      heightCm: 178,
      weightKg: 77.3,
      neckCm: 38.6,
      waistCm: 83.0,
      modeUsed: "solo",
    });
    expect(autoIdSnap.id).toMatch(/^body-/);
    expect(autoIdSnap.shoulderToWaistRatio).toBeUndefined();
  });
});

describe("Gym Strength Engine (Epley 1RM, Volume, PR Detection)", () => {
  it("calculates Epley 1RM for reps === 1, reps > 1, and invalid inputs", () => {
    expect(calculateEpley1Rm(100, 1)).toBe(100);
    expect(calculateEpley1Rm(80, 6)).toBe(96);
    expect(calculateEpley1Rm(65, 8)).toBe(82.3);
    expect(calculateEpley1Rm(0, 8)).toBe(0);
    expect(calculateEpley1Rm(80, 0)).toBe(0);
    expect(calculateEpley1Rm(-50, 5)).toBe(0);
  });

  it("calculates set volume accurately and returns 0 on invalid inputs", () => {
    expect(calculateSetVolume(62.5, 8)).toBe(500);
    expect(calculateSetVolume(37.5, 11)).toBe(412.5);
    expect(calculateSetVolume(0, 10)).toBe(0);
    expect(calculateSetVolume(50, -3)).toBe(0);
  });

  it("detects personal records only when previous sets exist and new 1RM strictly exceeds max", () => {
    expect(isNewPersonalRecord(90, [])).toBe(false);
    expect(
      isNewPersonalRecord(90, [{ estimated1RmKg: 85 }, { estimated1RmKg: 90 }])
    ).toBe(false);
    expect(
      isNewPersonalRecord(90.5, [{ estimated1RmKg: 85 }, { estimated1RmKg: 90 }])
    ).toBe(true);
    expect(isNewPersonalRecord(0, [{ estimated1RmKg: 50 }])).toBe(false);
  });
});

describe("Longitudinal Series Deltas & Day Window Filtering", () => {
  it("sorts items chronologically ascending and computes deltaFromPrev and deltaFromFirst", () => {
    const raw = [
      { date: "2026-11-20", waist: 83.0 },
      { date: "2026-10-10", waist: 85.5 },
      { date: "2026-11-01", waist: 84.2 },
    ];

    const series = computeSeriesWithDeltas(
      raw,
      (x) => x.date,
      (x) => x.waist
    );

    expect(series.map((s) => s.date)).toEqual([
      "2026-10-10",
      "2026-11-01",
      "2026-11-20",
    ]);
    expect(series[0].deltaFromPrev).toBeNull();
    expect(series[0].deltaFromFirst).toBe(0);
    expect(series[1].deltaFromPrev).toBe(-1.3);
    expect(series[1].deltaFromFirst).toBe(-1.3);
    expect(series[2].deltaFromPrev).toBe(-1.2);
    expect(series[2].deltaFromFirst).toBe(-2.5);
  });

  it("handles empty series in computeSeriesWithDeltas", () => {
    expect(
      computeSeriesWithDeltas(
        [],
        (x: { d: string; v: number }) => x.d,
        (x) => x.v
      )
    ).toEqual([]);
  });

  it("filters items within [referenceDate - days, referenceDate] inclusive or returns all", () => {
    const entries = [
      { date: "2026-10-01", val: 1 },
      { date: "2026-11-19", val: 2 },
      { date: "2026-11-26", val: 3 },
      { date: "2026-11-27", val: 4 },
    ];

    const last7 = filterByDayWindow(
      entries,
      (e) => e.date,
      "2026-11-26",
      7
    );
    expect(last7.map((e) => e.date)).toEqual(["2026-11-19", "2026-11-26"]);

    const all = filterByDayWindow(
      entries,
      (e) => e.date,
      "2026-11-26",
      "all"
    );
    expect(all).toHaveLength(4);
  });

  it("handles month/year boundaries in filterByDayWindow without timezone drift", () => {
    const entries = [
      { date: "2025-12-24", val: 1 },
      { date: "2025-12-25", val: 2 },
      { date: "2026-01-03", val: 3 },
    ];
    const last10 = filterByDayWindow(
      entries,
      (e) => e.date,
      "2026-01-03",
      9
    );
    expect(last10.map((e) => e.date)).toEqual(["2025-12-25", "2026-01-03"]);
  });

  it("returns empty array when referenceDate or days window is invalid", () => {
    const entries = [{ date: "2026-11-20", val: 1 }];
    expect(
      filterByDayWindow(entries, (e) => e.date, "invalid-date", 7)
    ).toEqual([]);
    expect(
      filterByDayWindow(entries, (e) => e.date, "2026-11-26", -5)
    ).toEqual([]);
  });

  it("classifies female athletic-meso, lean-agile, and power-enduro accurately", () => {
    expect(
      classifyMorphologicalProfile({
        sex: "female",
        bodyFatPct: 21.5,
        waistToHeightRatio: 0.43,
        shoulderToWaistRatio: 1.31,
      })
    ).toBe("athletic-meso");

    expect(
      classifyMorphologicalProfile({
        sex: "female",
        bodyFatPct: 19.0,
        waistToHeightRatio: 0.4,
        shoulderToWaistRatio: 1.2,
      })
    ).toBe("lean-agile");

    expect(
      classifyMorphologicalProfile({
        sex: "female",
        bodyFatPct: 33.0,
        waistToHeightRatio: 0.54,
      })
    ).toBe("power-enduro");
  });
});
