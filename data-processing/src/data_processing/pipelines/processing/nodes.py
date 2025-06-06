"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

from typing import Callable

import geopandas as gpd
import numpy as np
import pandas as pd
import polars as pl
import polars.selectors as cs
import xarray as xr
from exactextract import exact_extract
from rasterio.transform import from_origin


def _pivot_to_raster(df: pl.DataFrame, column: str) -> np.ndarray:
    df = df.sort("Lat", descending=True)
    p = df.pivot(on="Lon", index="Lat", values=column).drop("Lat")
    # Resort the columns by numeric value because pivot messes it up
    p = p.select([str(a) for a in sorted(float(e) for e in p.columns)])
    return p.to_numpy()[None, :, :]


def grid_table_to_rasters(
    grid_table: pl.LazyFrame, category_columns: list[str], category_map: dict[str, int]
) -> dict[str, xr.DataArray]:
    LOW_SCENARIO_EXPERIMENT = 2.6
    HIGH_SCNEARIO_EXPERIMENT = 8.5
    # convert climate index category columns to integer codes
    grid_table = grid_table.with_columns(
        cs.by_name(category_columns).replace_strict(category_map, return_dtype=pl.Int8)
    )
    df = (
        grid_table.group_by("Lat", "Lon", "Experiment")
        .agg(cs.float().median(), cs.by_name(category_columns).mode().first())
        .collect()
    )

    experiment_low = df.filter(pl.col("Experiment") == LOW_SCENARIO_EXPERIMENT).sort(
        "Lat", descending=True
    )
    experiment_high = df.filter(pl.col("Experiment") == HIGH_SCNEARIO_EXPERIMENT).sort(
        "Lat", descending=True
    )
    # By defaut keep all decimal columns and the provided by columns_to_keep
    indicator_columns = df.select(
        cs.float().exclude("Lat", "Lon", "Experiment") | cs.by_name(category_columns)
    ).columns
    northest = df.select(pl.col("Lat").max()).item()
    westest = df.select(pl.col("Lon").min()).item()
    transform = from_origin(westest, northest, 1, 1)
    parts = {}
    for column in indicator_columns:
        dtype = np.int8 if column in category_columns else np.float32
        data_low = xr.DataArray(
            _pivot_to_raster(experiment_low, column).astype(dtype),
            dims=["band", "y", "x"],
        )
        data_high = xr.DataArray(
            _pivot_to_raster(experiment_high, column).astype(dtype),
            dims=["band", "y", "x"],
        )

        data_low = data_low.rio.write_crs("EPSG:4326").rio.write_transform(transform)
        data_high = data_high.rio.write_crs("EPSG:4326").rio.write_transform(transform)

        parts[f"{column}_low"] = data_low
        parts[f"{column}_high"] = data_high
    return parts


def rename_protected_areas_columns(
    gdf: gpd.GeoDataFrame, columns_map: dict[str, str]
) -> gpd.GeoDataFrame:
    if "Km2" in gdf.columns:
        gdf["Km2"] *= 100  # convert to Ha
    renamed = gdf.rename(columns=columns_map)
    columns = [col for col in columns_map.values()]
    columns.append("geometry")
    return renamed[columns]


def concat_marine_protected_area(
    areas1: gpd.GeoDataFrame,
    areas2: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    df = pd.concat([areas1, areas2], ignore_index=True)
    # Drop "existing site" because they already present in one of the datasets
    df = df.loc[df["type"] != "Existing site"]
    return df


def aggregate_per_mpas(
    mpas: gpd.GeoDataFrame,
    rasters: dict[str, Callable[[], xr.DataArray]],
    category_columns: list[str],
) -> gpd.GeoDataFrame:
    for indicator_name, raster_loader in rasters.items():
        ops = "mode" if indicator_name in category_columns else "mean"
        mpas[indicator_name] = exact_extract(
            raster_loader(), mpas, ops, output="pandas"
        )
    return mpas
