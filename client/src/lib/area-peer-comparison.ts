import type { Area, IndicatorStats } from "@/containers/main/table/columns";
import { BIOREGIONS } from "@/lib/bioregions";
import { PROTECTION_TYPES } from "@/lib/protection-types";
import type { SCENARIO } from "@/types";

export type AreaPeerComparisonRow = {
  key: string;
  label: string;
  // e.g. "Bioregion · 42 areas"; absent on the area's own row
  description?: string;
  values: Record<SCENARIO, IndicatorStats> | null;
};

const climVuln = (area: Area) =>
  area.indicator.find((indicator) => indicator.name === "ClimVuln")?.scenario;

const hasData = (scenario: Record<SCENARIO, IndicatorStats> | undefined) =>
  scenario !== undefined && scenario.low.mean !== null && scenario.high.mean !== null;

// Every peer site weighs the same: mean of the peers' ClimVuln means, with the
// lowest and highest peer mean as the range. The area itself is not a peer.
function peerStats(peers: Area[], scenario: SCENARIO): IndicatorStats {
  const means = peers.map((peer) => climVuln(peer)![scenario].mean!);
  return {
    min: Math.min(...means),
    mean: means.reduce((sum, mean) => sum + mean, 0) / means.length,
    max: Math.max(...means),
  };
}

function peerRow(key: string, label: string, kind: string, peers: Area[]): AreaPeerComparisonRow {
  const withData = peers.filter((peer) => hasData(climVuln(peer)));
  const count = `${withData.length} ${withData.length === 1 ? "area" : "areas"}`;
  return {
    key,
    label,
    description: `${kind} · ${count}`,
    values: withData.length
      ? { low: peerStats(withData, "low"), high: peerStats(withData, "high") }
      : null,
  };
}

export function areaPeerComparison(area: Area, areas: Area[]): AreaPeerComparisonRow[] {
  const others = areas.filter((other) => other.id !== area.id);
  const own = climVuln(area);

  const bioregionRows = area.regions.map((region) =>
    peerRow(
      `bioregion:${region}`,
      BIOREGIONS.find((bioregion) => bioregion.region === region)?.label ?? region,
      "Bioregion",
      others.filter((other) => other.regions.includes(region)),
    ),
  );

  const governanceRow = peerRow(
    `governance:${area.governance_type}`,
    PROTECTION_TYPES.find((type) => type.governanceType === area.governance_type)?.label ??
      area.governance_type,
    "Protection type",
    others.filter((other) => other.governance_type === area.governance_type),
  );

  return [
    { key: "self", label: "This area", values: hasData(own) ? own! : null },
    ...bioregionRows,
    governanceRow,
  ];
}
