import { describe, expect, it } from "vitest";
import {
  advanceMobCharge,
  createDuoOperationFromTemplate,
  DUO_OPERATION_TEMPLATES,
  isMobShieldActive,
  MOB_CHARGE_DELTAS,
  MOB_EMOTION_META,
  resolveDominantEmotion,
} from "@/lib/mob-meter-domain";
import { MobEmotionId } from "@/types/mob";

const ZERO_SOURCES: Record<MobEmotionId, number> = {
  determinacion: 0,
  coraje: 0,
  vinculo: 0,
  claridad: 0,
};

describe("MOB 0% -> 100% Charge Engine (advanceMobCharge)", () => {
  it("exposes calibrated positive deltas for all MOB actions", () => {
    expect(MOB_CHARGE_DELTAS).toEqual({
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
    });
  });

  it("accumulates sub-100% charge and updates the matching emotion source without detonating", () => {
    const res = advanceMobCharge({
      currentCharge: 82,
      cycleSources: { determinacion: 24, coraje: 18, vinculo: 16, claridad: 24 },
      delta: MOB_CHARGE_DELTAS.HABIT_GOLD, // +9 -> 91
      emotionSource: "determinacion",
      triggerAction: "Entrenar cuerpo (Oro)",
      nowIso: "2026-11-26T10:00:00.000Z",
    });

    expect(res.reachedHundred).toBe(false);
    expect(res.nextCharge).toBe(91);
    expect(res.nextSources).toEqual({
      determinacion: 33,
      coraje: 18,
      vinculo: 16,
      claridad: 24,
    });
    expect(res.moment).toBeUndefined();
    expect(res.nextShieldUntil).toBeUndefined();
  });

  it("ignores non-positive deltas safely without mutating charge", () => {
    const res = advanceMobCharge({
      currentCharge: 55,
      cycleSources: { determinacion: 12, coraje: 10, vinculo: 8, claridad: 25 },
      delta: 0,
      emotionSource: "claridad",
      triggerAction: "No-op",
    });

    expect(res.reachedHundred).toBe(false);
    expect(res.nextCharge).toBe(55);
    expect(res.nextSources.claridad).toBe(25);
    expect(res.moment).toBeUndefined();
  });

  it("detonates at exact 100%, resets cycle sources, sets nextCharge to 0, and activates 24h shield", () => {
    const nowIso = "2026-11-26T14:30:00.000Z";
    const res = advanceMobCharge({
      currentCharge: 90,
      cycleSources: { determinacion: 30, coraje: 20, vinculo: 15, claridad: 25 },
      delta: MOB_CHARGE_DELTAS.MAIN_MISSION, // +10 -> 100
      emotionSource: "claridad",
      triggerAction: "Misión Principal: Cerrar entrega clave",
      nowIso,
    });

    expect(res.reachedHundred).toBe(true);
    expect(res.nextCharge).toBe(0);
    expect(res.nextSources).toEqual(ZERO_SOURCES);
    expect(res.nextShieldUntil).toBe("2026-11-27T14:30:00.000Z");
    expect(res.moment).toBeDefined();
    expect(res.moment?.emotion).toBe("claridad"); // 25 + 10 = 35 > 30
    expect(res.moment?.title).toBe("100% Claridad");
    expect(res.moment?.unlockedAt).toBe(nowIso);
    expect(res.moment?.shieldExpiresAt).toBe("2026-11-27T14:30:00.000Z");
    expect(res.moment?.triggerAction).toBe("Misión Principal: Cerrar entrega clave");
  });

  it("carries over excess charge above 100% accurately when overflow <= 25", () => {
    const res = advanceMobCharge({
      currentCharge: 96,
      cycleSources: { determinacion: 45, coraje: 20, vinculo: 15, claridad: 16 },
      delta: MOB_CHARGE_DELTAS.DUO_OPERATION_BONUS, // +12 -> 108 => carry-over 8
      emotionSource: "vinculo",
      triggerAction: "Operación Dúo completada",
      nowIso: "2026-11-26T18:00:00.000Z",
    });

    expect(res.reachedHundred).toBe(true);
    expect(res.nextCharge).toBe(8);
    expect(res.nextSources).toEqual(ZERO_SOURCES);
    expect(res.moment?.emotion).toBe("determinacion");
  });

  it("caps carry-over charge at 25 when large overflow occurs", () => {
    const res = advanceMobCharge({
      currentCharge: 98,
      cycleSources: { determinacion: 20, coraje: 50, vinculo: 14, claridad: 14 },
      delta: 40, // 138 -> raw overflow 38 -> capped at 25
      emotionSource: "coraje",
      triggerAction: "Mega racha de esfuerzo",
      nowIso: "2026-11-26T19:00:00.000Z",
    });

    expect(res.reachedHundred).toBe(true);
    expect(res.nextCharge).toBe(25);
    expect(res.moment?.emotion).toBe("coraje");
    expect(res.moment?.title).toBe(MOB_EMOTION_META.coraje.title);
  });
});

describe("Dominant Emotion Resolution (resolveDominantEmotion)", () => {
  it("resolves 'determinacion' when Determinación leads", () => {
    expect(
      resolveDominantEmotion({
        determinacion: 42,
        coraje: 18,
        vinculo: 20,
        claridad: 20,
      })
    ).toBe("determinacion");
  });

  it("resolves 'coraje' when Coraje leads", () => {
    expect(
      resolveDominantEmotion({
        determinacion: 20,
        coraje: 44,
        vinculo: 16,
        claridad: 20,
      })
    ).toBe("coraje");
  });

  it("resolves 'vinculo' when Vínculo leads", () => {
    expect(
      resolveDominantEmotion({
        determinacion: 15,
        coraje: 15,
        vinculo: 48,
        claridad: 22,
      })
    ).toBe("vinculo");
  });

  it("resolves 'claridad' when Claridad leads", () => {
    expect(
      resolveDominantEmotion({
        determinacion: 18,
        coraje: 22,
        vinculo: 12,
        claridad: 48,
      })
    ).toBe("claridad");
  });

  it("uses fallback emotion on zeroed sources or exact max tie with triggering emotion", () => {
    expect(resolveDominantEmotion(ZERO_SOURCES, "vinculo")).toBe("vinculo");
    expect(
      resolveDominantEmotion(
        { determinacion: 30, coraje: 30, vinculo: 20, claridad: 20 },
        "coraje"
      )
    ).toBe("coraje");
  });
});

describe("24-Hour MOB Shield Window (isMobShieldActive)", () => {
  const shieldUntil = "2026-11-27T12:00:00.000Z";

  it("returns true while current time is strictly before 24h expiry", () => {
    expect(isMobShieldActive(shieldUntil, "2026-11-26T12:00:01.000Z")).toBe(true);
    expect(isMobShieldActive(shieldUntil, "2026-11-27T11:59:59.999Z")).toBe(true);
  });

  it("returns false at or after 24h expiry, or when undefined/invalid", () => {
    expect(isMobShieldActive(shieldUntil, "2026-11-27T12:00:00.000Z")).toBe(false);
    expect(isMobShieldActive(shieldUntil, "2026-11-28T08:00:00.000Z")).toBe(false);
    expect(isMobShieldActive(undefined, "2026-11-26T12:00:00.000Z")).toBe(false);
    expect(isMobShieldActive("invalid-date", "2026-11-26T12:00:00.000Z")).toBe(false);
  });
});

describe("Co-op Duo Operation Templates (createDuoOperationFromTemplate)", () => {
  it("provides all 3 GTA-heist-inspired co-op templates with complementary me & partner stages", () => {
    expect(DUO_OPERATION_TEMPLATES.map((t) => t.id)).toEqual([
      "op-doble-turno",
      "op-constancia-48h",
      "op-cuerpo-mente",
    ]);

    for (const tpl of DUO_OPERATION_TEMPLATES) {
      expect(tpl.stages.length).toBeGreaterThanOrEqual(3);
      expect(tpl.stages.length).toBeLessThanOrEqual(4);
      expect(tpl.stages.some((s) => s.owner === "me")).toBe(true);
      expect(tpl.stages.some((s) => s.owner === "partner")).toBe(true);
    }
  });

  it("creates fresh uncompleted DuoOperationState for a requested template and preserves completedCount", () => {
    const op = createDuoOperationFromTemplate("op-constancia-48h", 3);
    expect(op.templateId).toBe("op-constancia-48h");
    expect(op.title).toBe("Golpe Cero Excusas 48h");
    expect(op.durationDays).toBe(2);
    expect(op.rewardMobCharge).toBe(MOB_CHARGE_DELTAS.DUO_OPERATION_BONUS);
    expect(op.completedCount).toBe(3);
    expect(op.stages.every((s) => s.completed === false)).toBe(true);
  });

  it("falls back gracefully to 'op-doble-turno' if an unknown templateId is given", () => {
    const fallbackOp = createDuoOperationFromTemplate("non-existent-id", -2);
    expect(fallbackOp.templateId).toBe("op-doble-turno");
    expect(fallbackOp.title).toBe("Operación Doble Turno");
    expect(fallbackOp.completedCount).toBe(0);
  });
});
