import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  advanceMobCharge,
  createDuoOperationFromTemplate,
  DUO_OPERATION_TEMPLATES,
  MOB_CHARGE_DELTAS,
} from "@/lib/mob-meter-domain";

describe("TICKET-07 — Duo Operations & Club de Mejora Respect Integration", () => {
  it("exposes all 3 GTA-style Duo Operation templates with expected titles, durations, and +12% MOB completion bonus", () => {
    expect(DUO_OPERATION_TEMPLATES.map((t) => t.title)).toEqual([
      "Operación Doble Turno",
      "Golpe Cero Excusas 48h",
      "Sincronía Cuerpo y Mente",
    ]);

    expect(DUO_OPERATION_TEMPLATES.map((t) => t.durationDays)).toEqual([1, 2, 3]);

    for (const tpl of DUO_OPERATION_TEMPLATES) {
      const state = createDuoOperationFromTemplate(tpl.id, 2);
      expect(state.rewardMobCharge).toBe(12);
      expect(state.completedCount).toBe(2);
      expect(state.stages.some((s) => s.owner === "me")).toBe(true);
      expect(state.stages.some((s) => s.owner === "partner")).toBe(true);
    }
  });

  it("accumulates +2% MOB on Vínculo when sending a Club de Mejora respect salute", () => {
    const res = advanceMobCharge({
      currentCharge: 82,
      cycleSources: { determinacion: 24, coraje: 18, vinculo: 16, claridad: 24 },
      delta: MOB_CHARGE_DELTAS.RESPECT_SALUTE,
      emotionSource: "vinculo",
      triggerAction: "Respeto enviado a Nico",
    });

    expect(MOB_CHARGE_DELTAS.RESPECT_SALUTE).toBe(2);
    expect(res.nextCharge).toBe(84);
    expect(res.nextSources.vinculo).toBe(18);
    expect(res.reachedHundred).toBe(false);
  });

  it("verifies BondsView wires Duo Operations, template selector, stage toggles, and Club de Mejora respect salutes", () => {
    const bondsViewPath = path.resolve(
      __dirname,
      "../src/components/BondsView.tsx"
    );
    const source = fs.readFileSync(bondsViewPath, "utf8");

    // Context & domain hooks
    expect(source).toContain("DUO_OPERATION_TEMPLATES");
    expect(source).toContain("state.duoOperation");
    expect(source).toContain("toggleDuoOperationStage");
    expect(source).toContain("switchDuoOperationTemplate");
    expect(source).toContain("sendRespectSalute");
    expect(source).toContain("state.respectSentTodayKeys");

    // Duo Operation reward & owner badges (terracotta soft vs sage soft)
    expect(source).toContain("MOB al cerrar");
    expect(source).toContain("var(--accent-action-soft)");
    expect(source).toContain("var(--accent-sage-soft)");

    // Club de Mejora Corporal camaraderie copy + privacy lock note + respect button states
    expect(source).toContain(
      "Aquí se respeta cada gota de esfuerzo — incluso sostener el Bronce en un día pesado."
    );
    expect(source).toContain("métricas corporales");
    expect(source).toContain("Respeto enviado hoy ✓");
    expect(source).toContain("¡Buen esfuerzo hoy!");
    expect(source).toContain("Respeto enviado ✓");
    expect(source).toContain("¡Buen esfuerzo!");
  });
});
