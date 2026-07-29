"""Pipeline 'climate_risk_cogs': builds COG rasters from the zarr cube produced by
the 'zarr_cube' pipeline. Both nodes take `species_grid_zarr_build_summary` as an
input so kedro's DAG enforces that the cube exists before these run."""

from kedro.pipeline import Pipeline, node

from data_processing.pipelines.climate_risk_cogs.nodes import (
    build_general_climate_risk_cogs,
    build_species_climate_risk_cogs,
)


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                func=build_general_climate_risk_cogs,
                inputs=["species_grid_zarr_build_summary", "parameters"],
                outputs="general_climate_risk_cog_summary",
                name="build_general_climate_risk_cogs",
                tags=["cog", "general-risk-cog"],
            ),
            node(
                func=build_species_climate_risk_cogs,
                inputs=["species_grid_zarr_build_summary", "parameters"],
                outputs="species_climate_risk_cog_summary",
                name="build_species_climate_risk_cogs",
                tags=["cog", "species-risk-cog"],
            ),
        ]
    )
