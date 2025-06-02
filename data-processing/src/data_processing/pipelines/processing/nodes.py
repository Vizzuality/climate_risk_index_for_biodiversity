"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

import geopandas as gpd
import numpy as np
import pandas as pd
import polars as pl
import polars.selectors as cs
import xarray as xr
from rasterio.transform import from_origin


def _pivot_to_raster(df: pl.DataFrame, column: str) -> np.ndarray:
    df = df.sort("Lat", descending=True)
    p = df.pivot(on="Lon", index="Lat", values=column).drop("Lat")
    # Resort the columns by numeric value because pivot messes it up
    p = p.select([str(a) for a in sorted(float(e) for e in p.columns)])
    return p.to_numpy()[None, :, :]


def grid_table_to_rasters(grid_table: pl.LazyFrame) -> dict[str, xr.DataArray]:
    df = (
        grid_table.group_by("Lat", "Lon", "Experiment")
        .agg(cs.float().median())
        .collect()
    )

    experiment_low = df.filter(pl.col("Experiment") == 2.6).sort("Lat", descending=True)
    experiment_high = df.filter(pl.col("Experiment") == 8.5).sort(
        "Lat", descending=True
    )

    indicator_columns = df.select(
        cs.float().exclude("Lat", "Lon", "Experiment")
    ).columns

    northest = df.select(pl.col("Lat").max()).item()
    westest = df.select(pl.col("Lon").min()).item()
    transform = from_origin(westest, northest, 1, 1)
    parts = {}

    for column in indicator_columns:
        data_low = xr.DataArray(
            _pivot_to_raster(experiment_low, column),
            dims=["band", "y", "x"],
        )
        data_high = xr.DataArray(
            _pivot_to_raster(experiment_high, column),
            dims=["band", "y", "x"],
        )

        data_low = data_low.rio.write_crs("EPSG:4326").rio.write_transform(transform)
        data_high = data_high.rio.write_crs("EPSG:4326").rio.write_transform(transform)

        parts[f"{column}_low"] = data_low
        parts[f"{column}_high"] = data_high
    return parts


def rename_columns(
    gdf: gpd.GeoDataFrame, columns_map: dict[str, str]
) -> gpd.GeoDataFrame:
    if "Km2" in gdf.columns:
        gdf["Km2"] = gdf["Km2"] * 100  # convert to Ha
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
