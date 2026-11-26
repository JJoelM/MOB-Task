import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getMeasurementGuide,
  getMeasurementSvgPath,
  MEASUREMENT_GUIDES,
} from "@/lib/measurement-guides";
import { MeasurementMode, MeasurementZone } from "@/types/mob";

const EXPECTED_ZONES: MeasurementZone[] = [
  "neck",
  "waist",
  "hip",
  "shoulders",
  "chest",
  "biceps",
  "thigh",
  "calf",
];

const MODES: MeasurementMode[] = ["solo", "assisted"];

describe("MEASUREMENT_GUIDES & 16 SVG Tape Illustrations", () => {
  it("covers all 8 MeasurementZones in order (essential first, then complete)", () => {
    expect(MEASUREMENT_GUIDES).toHaveLength(8);
    expect(MEASUREMENT_GUIDES.map((g) => g.zone)).toEqual(EXPECTED_ZONES);

    const essentialZones = MEASUREMENT_GUIDES.filter(
      (g) => g.tier === "essential"
    ).map((g) => g.zone);
    const completeZones = MEASUREMENT_GUIDES.filter(
      (g) => g.tier === "complete"
    ).map((g) => g.zone);

    expect(essentialZones).toEqual(["neck", "waist", "hip"]);
    expect(completeZones).toEqual([
      "shoulders",
      "chest",
      "biceps",
      "thigh",
      "calf",
    ]);
  });

  it("provides landmark, 2 solo cues, 2 assisted cues, and duoTip for every zone", () => {
    for (const zone of EXPECTED_ZONES) {
      const guide = getMeasurementGuide(zone);
      expect(guide.zone).toBe(zone);
      expect(guide.label.length).toBeGreaterThan(2);
      expect(guide.landmark.length).toBeGreaterThan(10);
      expect(guide.soloCues).toHaveLength(2);
      expect(guide.assistedCues).toHaveLength(2);
      expect(guide.soloCues[0].trim().length).toBeGreaterThan(10);
      expect(guide.soloCues[1].trim().length).toBeGreaterThan(10);
      expect(guide.assistedCues[0].trim().length).toBeGreaterThan(10);
      expect(guide.assistedCues[1].trim().length).toBeGreaterThan(10);
      expect(guide.duoTip.trim().length).toBeGreaterThan(10);
    }
  });

  it("verifies all 16 standalone SVG files exist on disk with valid <svg> markup and #D95D39 tape path", () => {
    const publicDir = path.resolve(__dirname, "../public");

    for (const zone of EXPECTED_ZONES) {
      for (const mode of MODES) {
        const publicUrlPath = getMeasurementSvgPath(zone, mode);
        expect(publicUrlPath).toBe(`/measurements/${zone}-${mode}.svg`);

        const diskPath = path.join(publicDir, publicUrlPath);
        expect(
          fs.existsSync(diskPath),
          `Expected SVG file to exist at ${diskPath}`
        ).toBe(true);

        const content = fs.readFileSync(diskPath, "utf8");
        expect(content).toContain("<svg");
        expect(content).toContain("</svg>");
        expect(content).toContain('viewBox="0 0 320 220"');
        expect(content.toUpperCase()).toContain("#D95D39");

        if (mode === "assisted") {
          expect(content.toUpperCase()).toContain("#2B7A57");
        }
      }
    }
  });
});
