"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Pipeline, node, pipeline

from data_processing.pipelines.processing.nodes import (
    concat_marine_protected_area,
    grid_table_to_rasters,
    rename_protected_areas_columns,
)


def create_pipeline(**kwargs) -> Pipeline:
    return pipeline(
        [
            node(
                grid_table_to_rasters,
                [
                    "grid_raw",
                    "params:grid_category_columns",
                    "params:grid_indices_categorical_map",
                ],
                "indicator_rasters",
                tags="raster",
            ),
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
                "marine_protected_areas",
                tags="mpas",
            ),
            # node(
            #     aggregate_per_mpas,
            #     ['raster', 'mpas'],
            #     'geometries with aggregation values'
            # )
        ]
    )
