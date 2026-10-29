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

const normalizeIds = (ids: readonly string[]) =>
  [...new Set(ids.filter((id) => /^\d+$/.test(id)))].sort((a, b) => Number(a) - Number(b));

// Numeric ids from an open-ended set, like species, in ascending order. A single id in the URL
// is read back as a number.
export const idList = (): SearchCodec<string[]> => ({
  parse: (raw) => {
    if (typeof raw === "number") return normalizeIds([String(raw)]);
    return typeof raw === "string" ? normalizeIds(raw.split(",")) : [];
  },
  serialize: (ids) => normalizeIds(ids).join(","),
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
// instead of the default `%2C` and `%3A`. Number-like strings are written JSON-quoted so they
// read back as strings; a single species id drops the quotes, as `idList` reads numbers too.
export const stringifySearch = (search: Record<string, unknown>) =>
  defaultStringifySearch(search)
    .replaceAll("%2C", ",")
    .replaceAll("%3A", ":")
    .replace(/([?&]species=)%22(\d+)%22/, "$1$2");
