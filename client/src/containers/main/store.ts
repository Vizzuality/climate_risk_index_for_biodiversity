import { type SearchSchemaInput, useNavigate, useSearch } from "@tanstack/react-router";

type AreaListSearch = { q: string };

export const AREA_LIST_SEARCH_DEFAULTS: AreaListSearch = { q: "" };

export const validateAreaListSearch = (
  search: { q?: unknown } & SearchSchemaInput,
): AreaListSearch => ({
  q: typeof search.q === "string" ? search.q : AREA_LIST_SEARCH_DEFAULTS.q,
});

// Non-strict so the hook works under any route tree whose list route validates `q`.
export const useAreaSearch = () => {
  const { q = AREA_LIST_SEARCH_DEFAULTS.q } = useSearch({ strict: false });
  const navigate = useNavigate();
  const setQ = (next: string) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, q: next }), replace: true });
  return [q, setQ] as const;
};
