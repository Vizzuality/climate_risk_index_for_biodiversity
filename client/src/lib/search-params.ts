import { defaultStringifySearch } from "@tanstack/react-router";

export type SearchCodec<T> = { parse: (raw: unknown) => T; serialize: (value: T) => string };

// Serialized in the allowed order so equal selections always produce the same URL. A missing
// param parses to `fallback`; an empty one always means nothing is selected.
export const multiValue = <T extends string>(
  allowed: readonly T[],
  fallback: readonly T[] = [],
): SearchCodec<T[]> => ({
  parse: (raw) => {
    if (typeof raw !== "string") return allowed.filter((value) => fallback.includes(value));
    const values = new Set(raw.split(","));
    return allowed.filter((value) => values.has(value));
  },
  serialize: (values) => allowed.filter((value) => values.includes(value)).join(","),
});

const toPercentStep = (value: number) => Math.min(100, Math.max(0, Math.round(value / 10) * 10));

// `key:percent` pairs in 10% steps, e.g. `risk:60,areas:80`. Full (100%) entries are left out
// and keys are written in the allowed order, so equal values always produce the same URL.
export const percentByKey = <T extends string>(
  allowed: readonly T[],
): SearchCodec<Partial<Record<T, number>>> => ({
  parse: (raw) => {
    const values: Partial<Record<T, number>> = {};
    if (typeof raw !== "string") return values;
    for (const pair of raw.split(",")) {
      const [key, value] = pair.split(":") as [T, string | undefined];
      if (!allowed.includes(key) || key in values || !value) continue;
      const percent = Number(value);
      if (Number.isFinite(percent)) values[key] = toPercentStep(percent);
    }
    return values;
  },
  serialize: (values) =>
    allowed
      .flatMap((key) => {
        const value = values[key];
        if (value === undefined || toPercentStep(value) === 100) return [];
        return [`${key}:${toPercentStep(value)}`];
      })
      .join(","),
});

// Commas and colons are valid in a query string, so keep multi-value and keyed params readable
// instead of the default `%2C` and `%3A`.
export const stringifySearch = (search: Record<string, unknown>) =>
  defaultStringifySearch(search).replaceAll("%2C", ",").replaceAll("%3A", ":");
