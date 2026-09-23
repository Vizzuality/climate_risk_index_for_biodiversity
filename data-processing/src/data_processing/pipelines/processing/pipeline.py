"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Pipeline, node

from .nodes import (
    aggregate_species_grid,
    build_area_stats,
    compute_zonal_stats,
    fill_raster_nodata,
    grid_summary_to_raster,
    index_conservation_areas,
)

SCENARIOS = ("ssp126", "ssp585")


def _scenario_zonal_stats_nodes(scenario: str) -> list:
    return [
        node(
            func=fill_raster_nodata,
            inputs=f"crib_grid_raster_{scenario}",
            outputs=f"crib_grid_raster_filled_{scenario}",
            name=f"fill_raster_nodata_{scenario}_node",
        ),
        node(
            func=compute_zonal_stats,
            inputs=[
                "conservation_areas_indexed",
                f"crib_grid_raster_filled_{scenario}",
                f"params:experiments.{scenario}",
            ],
            outputs=f"conservation_area_stats_{scenario}",
            name=f"compute_zonal_stats_{scenario}_node",
        ),
    ]


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                func=aggregate_species_grid,
                inputs=[
                    "crib_species_canada",
                    "params:dim_cols",
                    "params:numeric_cols",
                ],
                outputs="crib_grid_summary",
                name="aggregate_species_grid_node",
            ),
            node(
                func=grid_summary_to_raster,
                inputs=[
                    "crib_grid_summary",
                    "params:experiments.ssp126",
                    "params:numeric_cols",
                    "params:raster.crs",
                ],
                outputs="crib_grid_raster_ssp126",
                name="grid_summary_to_raster_ssp126_node",
            ),
            node(
                func=grid_summary_to_raster,
                inputs=[
                    "crib_grid_summary",
                    "params:experiments.ssp585",
                    "params:numeric_cols",
                    "params:raster.crs",
                ],
                outputs="crib_grid_raster_ssp585",
                name="grid_summary_to_raster_ssp585_node",
            ),
            node(
                func=index_conservation_areas,
                inputs=[
                    "conservation_areas",
                    "params:raster.crs",
                ],
                outputs="conservation_areas_indexed",
                name="index_conservation_areas_node",
            ),
            *(n for s in SCENARIOS for n in _scenario_zonal_stats_nodes(s)),
            node(
                func=build_area_stats,
                inputs=[
                    "conservation_areas_indexed",
                    *(f"conservation_area_stats_{s}" for s in SCENARIOS),
                ],
                outputs="conservation_area_stats",
                name="build_area_stats_node",
            ),
        ]
    )
