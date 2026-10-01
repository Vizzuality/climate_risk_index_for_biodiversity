import { notFound, redirect } from "@tanstack/react-router";

const LEGACY_AREA_ID = /^\d+$/;

export function redirectToAreas(): never {
  throw redirect({ to: "/areas", search: true });
}

export function redirectLegacyArea({ params }: { params: { areaId: string } }): never {
  if (!LEGACY_AREA_ID.test(params.areaId)) throw notFound();
  throw redirect({ to: "/areas/$areaId", params, search: true });
}
