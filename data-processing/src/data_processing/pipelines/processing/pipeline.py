"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Pipeline, node, pipeline

from data_processing.pipelines.processing.nodes import (
    aggregate_indicators_per_mpas,
    clip_to_aoi_and_vectorize,
    concat_marine_protected_area,
    grid_table_to_rasters,
    join_admin_region,
    publish_mapbox_tileset,
    rename_protected_areas_columns,
)


def create_pipeline(**kwargs) -> Pipeline:
    return pipeline(
        [
            # Grid nodes
            node(
                grid_table_to_rasters,
                [
                    "grid_raw",
                    "params:grid_risk_category_columns",
                    "params:grid_risk_categorical_map",
                ],
                "indicator_rasters",
                tags="raster",
            ),
            node(
                clip_to_aoi_and_vectorize,
                ["indicator_rasters", "params:grid_layer_high"],
                "polygon_grid_high",
                tags="raster",
            ),
            node(
                clip_to_aoi_and_vectorize,
                ["indicator_rasters", "params:grid_layer_low"],
                "polygon_grid_low",
                tags="raster",
            ),
            node(
                publish_mapbox_tileset,
                [
                    "polygon_grid_high",
                    "params:grid_layer_high",
                    "params:mapbox_access_token",  # must be input manually in the terminal as --params
                    "params:mapbox_username",
                ],
                None,
                tags="raster",
            ),
            node(
                publish_mapbox_tileset,
                [
                    "polygon_grid_low",
                    "params:grid_layer_low",
                    "params:mapbox_access_token",  # must be input manually in the terminal as --params
                    "params:mapbox_username",
                ],
                None,
                tags="raster",
            ),
            # -----------------
            # MPAs related node
            # -----------------
            node(
                rename_protected_areas_columns,
                [
                    "conservation_network_reseau_raw",
                    "params:conservation_network_reseau_columns",
                ],
                "conservation_network_reseau_renamed",
                tags="mpas",
            ),
            node(
                rename_protected_areas_columns,
                [
                    "marine_protected_areas_raw",
                    "params:marine_protected_areas_columns",
                ],
                "marine_protected_areas_renamed",
                tags="mpas",
            ),
            node(
                concat_marine_protected_area,
                [
                    "conservation_network_reseau_renamed",
                    "marine_protected_areas_renamed",
                ],
                "marine_protected_areas_no_region",
                tags="mpas",
            ),
            node(
                join_admin_region,
                ["marine_protected_areas_no_region", "admin_boundaries"],
                "marine_protected_areas",
                tags="mpas",
            ),
            node(
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
