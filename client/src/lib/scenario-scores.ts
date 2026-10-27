import type { SCENARIO } from "@/types";

export type ScenarioScores = Record<SCENARIO, number | null>;

// The selected scenario's rows, keeping their order, each with its ClimVuln
// in both scenarios; a row missing from the other scenario scores null there.
export function withScenarioScores<T extends { ClimVuln: number }>(
  rows: Record<SCENARIO, T[]>,
  scenario: SCENARIO,
  key: (row: T) => string | number,
): (T & { scores: ScenarioScores })[] {
  const low = new Map(rows.low.map((row) => [key(row), row.ClimVuln]));
  const high = new Map(rows.high.map((row) => [key(row), row.ClimVuln]));
  return rows[scenario].map((row) => ({
    ...row,
    scores: { low: low.get(key(row)) ?? null, high: high.get(key(row)) ?? null },
  }));
}
