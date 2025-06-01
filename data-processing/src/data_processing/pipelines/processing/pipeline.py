"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from kedro.pipeline import Pipeline, node, pipeline

from data_processing.pipelines.processing.nodes import (  # noqa
    clean_marine_conservation_areas,
    grid_table_to_rasters,
)


def create_pipeline(**kwargs) -> Pipeline:
    return pipeline(
        [
            node(grid_table_to_rasters, "grid_raw", "indicator_rasters"),
            node(
                clean_marine_conservation_areas,
                "conservation_areas",
                "cleaned_conservation_areas",
            ),
        ]
    )
