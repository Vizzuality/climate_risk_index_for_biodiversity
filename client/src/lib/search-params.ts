import { defaultStringifySearch } from "@tanstack/react-router";

// Multi-value filters are comma-separated; commas are valid in a query string, so keep them
// readable instead of the default `%2C`.
export const stringifySearch = (search: Record<string, unknown>) =>
  defaultStringifySearch(search).replaceAll("%2C", ",");
