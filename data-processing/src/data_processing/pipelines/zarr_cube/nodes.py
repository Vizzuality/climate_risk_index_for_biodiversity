"""Nodes for the 'zarr_cube' pipeline."""

from __future__ import annotations

from data_processing.pipelines.zarr_cube.species_grid_zarr import (
    ChunkConfig,
    build_species_grid_cube,
)


def build_species_grid_zarr_cube(parameters: dict) -> dict:
    """Kedro node wrapping `build_species_grid_cube`. Reads its settings from the
    `species_grid_zarr` block of parameters_processing.yml (see conf/base) so the
    source glob, output path, and chunking can be tuned without touching code.
    """
    p = parameters["species_grid_zarr"]
    return build_species_grid_cube(
        parquet_glob=p["source_parquet_glob"],
        zarr_path=p["zarr_path"],
        chunks=ChunkConfig(
            species=p.get("species_chunk", 1), spatial=p.get("spatial_chunk", 100)
        ),
        file_limit=p.get("file_limit"),
    )
