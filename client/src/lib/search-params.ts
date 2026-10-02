import { defaultStringifySearch } from "@tanstack/react-router";

export type SearchCodec<T> = { parse: (raw: unknown) => T; serialize: (value: T) => string };

// Serialized in the allowed order so equal selections always produce the same URL.
export const multiValue = <T extends string>(allowed: readonly T[]): SearchCodec<T[]> => ({
  parse: (raw) => {
    if (typeof raw !== "string") return [];
    const values = new Set(raw.split(","));
    return allowed.filter((value) => values.has(value));
  },
  serialize: (values) => allowed.filter((value) => values.includes(value)).join(","),
});

// Multi-value params are comma-separated; commas are valid in a query string, so keep them
// readable instead of the default `%2C`.
export const stringifySearch = (search: Record<string, unknown>) =>
  defaultStringifySearch(search).replaceAll("%2C", ",");
