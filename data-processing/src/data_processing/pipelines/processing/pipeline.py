"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Pipeline, node

from .nodes import aggregate_species_grid, grid_summary_to_raster


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                func=aggregate_species_grid,
                inputs=[
                    "crib_species_canada",
                    "params:crib.dim_cols",
                    "params:crib.numeric_cols",
                ],
                outputs="crib_grid_summary",
                name="aggregate_species_grid_node",
            ),
            node(
                func=grid_summary_to_raster,
                inputs=[
                    "crib_grid_summary",
                    "params:crib.experiments.ssp126",
                    "params:crib.numeric_cols",
                    "params:crib.raster.nodata",
                    "params:crib.raster.crs",
                ],
                outputs="crib_grid_raster_ssp126",
                name="grid_summary_to_raster_ssp126_node",
            ),
            node(
                func=grid_summary_to_raster,
                inputs=[
                    "crib_grid_summary",
                    "params:crib.experiments.ssp585",
                    "params:crib.numeric_cols",
                    "params:crib.raster.nodata",
                    "params:crib.raster.crs",
                ],
                outputs="crib_grid_raster_ssp585",
                name="grid_summary_to_raster_ssp585_node",
            ),
        ]
    )
