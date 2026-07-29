"""Pipeline 'zarr_cube': builds the species x grid climate risk zarr cube."""

from kedro.pipeline import Pipeline, node

from data_processing.pipelines.zarr_cube.nodes import build_species_grid_zarr_cube


def create_pipeline(**kwargs) -> Pipeline:
    return Pipeline(
        [
            node(
                func=build_species_grid_zarr_cube,
                inputs="parameters",
                outputs="species_grid_zarr_build_summary",
                name="build_species_grid_zarr_cube",
                tags=["zarr"],
            ),
        ]
    )
