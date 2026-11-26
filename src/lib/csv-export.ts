function escapeCsvCell(cell: string | number): string {
  const raw =
    typeof cell === "number"
      ? Number.isFinite(cell)
        ? String(cell)
        : ""
      : String(cell ?? "");

  if (
    raw.includes(",") ||
    raw.includes('"') ||
    raw.includes("\n") ||
    raw.includes("\r")
  ) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

export function buildEvolutionCsv(
  headers: string[],
  rows: (string | number)[][]
): string {
  if (headers.length === 0 && rows.length === 0) {
    return "";
  }

  const lines: string[] = [];
  if (headers.length > 0) {
    lines.push(headers.map(escapeCsvCell).join(","));
  }
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}
