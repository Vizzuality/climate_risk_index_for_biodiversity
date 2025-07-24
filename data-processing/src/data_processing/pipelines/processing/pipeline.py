"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Node, Pipeline

from data_processing.pipelines.processing.nodes import (
    aggregate_indicators_per_mpas,
    clip_to_aoi_and_vectorize,
    concat_marine_protected_area,
    grid_table_to_rasters,
    join_admin_region,
    rename_protected_areas_columns,
)


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            # Grid Nodes
            Node(
                grid_table_to_rasters,
                [
                    "grid_raw",
                    "params:grid_risk_category_columns",
                    "params:grid_risk_categorical_map",
                ],
                "indicator_rasters",
                tags="raster",
                name="table_to_rasters",
            ),
            Node(
                clip_to_aoi_and_vectorize,
                ["indicator_rasters", "params:grid_layer_high"],
                "polygon_grid_high",
                tags="raster",
            ),
            Node(
                clip_to_aoi_and_vectorize,
                ["indicator_rasters", "params:grid_layer_low"],
                "polygon_grid_low",
                tags="raster",
            ),
            # -----------------
            # MPAs related Node
            # -----------------
            Node(
                rename_protected_areas_columns,
                [
                    "conservation_network_reseau_raw",
                    "params:conservation_network_reseau_columns",
                ],
                "conservation_network_reseau_renamed",
                tags="mpas",
            ),
            Node(
                rename_protected_areas_columns,
                [
                    "marine_protected_areas_raw",
                    "params:marine_protected_areas_columns",
                ],
                "marine_protected_areas_renamed",
                tags="mpas",
            ),
            Node(
                concat_marine_protected_area,
                [
                    "conservation_network_reseau_renamed",
                    "marine_protected_areas_renamed",
                ],
                "marine_protected_areas_no_region",
                tags="mpas",
            ),
            Node(
                join_admin_region,
                ["marine_protected_areas_no_region", "admin_boundaries"],
                "marine_protected_areas",
                tags="mpas",
            ),
            Node(
                aggregate_indicators_per_mpas,
                [
                    "marine_protected_areas",
                    "indicator_rasters",
                    "params:grid_risk_category_columns",
                ],
                "marine_protected_areas_list_index",
                tags="final",
            ),
        ]
    )
