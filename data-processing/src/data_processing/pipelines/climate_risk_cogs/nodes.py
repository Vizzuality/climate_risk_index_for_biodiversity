"""Nodes for the 'climate_risk_cogs' pipeline."""

from __future__ import annotations

from data_processing.pipelines.climate_risk_cogs.climate_risk_cog import (
    compute_general_climate_risk_cogs,
    compute_species_climate_risk_cogs,
)


def build_general_climate_risk_cogs(zarr_build_summary: dict, parameters: dict) -> dict:
    """Kedro node wrapping `compute_general_climate_risk_cogs`. Takes the zarr
    cube's build summary (produced by the `zarr_cube` pipeline) as an input rather
    than reading its path from parameters directly, so kedro's DAG actually knows
    this node depends on that build having run -- otherwise both pipelines would
    silently agree on a path via parameters with no dependency edge between them.
    Other settings live under `climate_risk_cog` in parameters_processing.yml.
    """
    p = parameters["climate_risk_cog"]
    return compute_general_climate_risk_cogs(
        zarr_path=zarr_build_summary["zarr_path"],
        output_dir=p["general_output_dir"],
        lat_band_size=p.get("lat_band_size", 100),
    )


def build_species_climate_risk_cogs(zarr_build_summary: dict, parameters: dict) -> dict:
    """Kedro node wrapping `compute_species_climate_risk_cogs`. See
    `build_general_climate_risk_cogs` for why the zarr path comes from the build
    summary rather than parameters.
    """
    p = parameters["climate_risk_cog"]
    return compute_species_climate_risk_cogs(
        zarr_path=zarr_build_summary["zarr_path"],
        output_dir=p["species_output_dir"],
        species_limit=p.get("species_limit"),
    )
