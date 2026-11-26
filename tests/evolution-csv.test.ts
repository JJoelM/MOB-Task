import { describe, expect, it } from "vitest";
import { buildEvolutionCsv } from "@/lib/fitness-domain";

describe("buildEvolutionCsv (RFC 4180 UTF-8 CSV builder)", () => {
  it("formats headers and numeric/string rows cleanly separated by commas and newlines", () => {
    const csv = buildEvolutionCsv(
      ["Fecha", "Ejercicio", "1RM (kg)", "Delta vs anterior"],
      [
        ["2026-11-21", "Press de Banca", 82.3, "+3.1 kg"],
        ["2026-11-12", "Press de Banca", 79.2, "+3.2 kg"],
      ]
    );

    expect(csv).toBe(
      [
        "Fecha,Ejercicio,1RM (kg),Delta vs anterior",
        "2026-11-21,Press de Banca,82.3,+3.1 kg",
        "2026-11-12,Press de Banca,79.2,+3.2 kg",
      ].join("\n")
    );
  });

  it("escapes cells containing commas, double quotes, and line breaks per RFC 4180", () => {
    const csv = buildEvolutionCsv(
      ["Fecha", "Medida, unidad", "Notas"],
      [
        ["2026-11-20", "83.0", 'Control "quincenal", postura firme'],
        ["2026-11-05", "84.2", "Línea 1\nLínea 2"],
      ]
    );

    expect(csv).toBe(
      [
        'Fecha,"Medida, unidad",Notas',
        '2026-11-20,83.0,"Control ""quincenal"", postura firme"',
        '2026-11-05,84.2,"Línea 1\nLínea 2"',
      ].join("\n")
    );
  });

  it("handles carriage returns, Spanish accents, delta symbols, and empty row sets", () => {
    const headerOnly = buildEvolutionCsv(
      ["Fecha", "Cintura (cm)", "Δ vs anterior", "Clasificación"],
      []
    );
    expect(headerOnly).toBe("Fecha,Cintura (cm),Δ vs anterior,Clasificación");

    const withCrLf = buildEvolutionCsv(["Nota"], [["Texto\r\ncon salto"]]);
    expect(withCrLf).toBe('Nota\n"Texto\r\ncon salto"');
  });

  it("returns empty string when both headers and rows are empty and sanitizes non-finite numbers", () => {
    expect(buildEvolutionCsv([], [])).toBe("");
    const withNaN = buildEvolutionCsv(["Valor", "Delta"], [[Number.NaN, 0]]);
    expect(withNaN).toBe("Valor,Delta\n,0");
  });
});
