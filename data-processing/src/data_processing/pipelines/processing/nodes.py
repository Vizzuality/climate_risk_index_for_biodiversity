"""
This is a boilerplate pipeline 'processing'
generated using Kedro 0.19.13
"""

import io
import logging
from collections.abc import Callable
from typing import Any

import geopandas as gpd
import httpx
import numpy as np
import pandas as pd
import polars as pl
import polars.selectors as cs
import rasterio.features
import xarray as xr
from exactextract import exact_extract
from polars.dependencies import json
from rasterio.transform import from_origin

from data_processing.models import MarineProtectedAreasIndex


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
        .agg(
            cs.float().median(),
            cs.by_name(category_columns).mode().first(),
        )
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
    return renamed[columns]  # type: ignore


def concat_marine_protected_area(
    areas1: gpd.GeoDataFrame,
    areas2: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    df = pd.concat([areas1, areas2], ignore_index=True)
    # Drop "existing site" because they already present in one of the datasets
    df = df.loc[df["type"] != "Existing site"]
    return df


def join_admin_region(
    mpas: gpd.GeoDataFrame, admin_region: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    return mpas.sjoin(  # type: ignore
        admin_region.loc[:, ["NAME_E", "geometry"]].rename(
            columns={"NAME_E": "admin_region"}
        ),
    ).drop_duplicates("name_en")


def aggregate_indicators_per_mpas(
    mpas: gpd.GeoDataFrame,
    rasters: dict[str, Callable[[], xr.DataArray]],
    category_columns: list[str],
) -> dict[str, Any]:
    log = logging.getLogger(__name__)
    stats_records = {}
    for indicator_name_scenario, raster_loader in rasters.items():
        indicator_name, scenario = indicator_name_scenario.split("_")
        log.info("Computing zonal stats %s scenario %s", indicator_name, scenario)
        is_categorical = indicator_name in category_columns
        stat_ops = "mode" if is_categorical else ["mean", "min", "max"]
        raster = raster_loader()
        zonal_stats = [
            entry["properties"]
            for entry in exact_extract(  # type: ignore
                raster,
                mpas,
                stat_ops,
                include_cols="name_en",
            )
        ]
        if stats_records.get(indicator_name) is None:
            stats_records[indicator_name] = {}
        stats_records[indicator_name].update({scenario: zonal_stats})
        del raster
    mpas = pd.concat([mpas, mpas.bounds], axis=1)  # type: ignore
    mpas_indicator_data = mpas.drop(columns="geometry").to_dict(orient="records")
    log.info("Reshaping data into destination schema...")
    for mpas_entry in mpas_indicator_data:
        mpa_name = mpas_entry["name_en"]
        mpas_entry["bbox"] = (
            mpas_entry["minx"],
            mpas_entry["miny"],
            mpas_entry["maxx"],
            mpas_entry["maxy"],
        )
        # init indicator field if not exists yet
        if mpas_entry.get("indicator") is None:
            mpas_entry["indicator"] = []
        for indicator_name, scenarios in stats_records.items():
            mpas_entry["indicator"].append(
                {
                    "name": indicator_name,
                    "type": "categorical"
                    if indicator_name in category_columns
                    else "numerical",
                    "scenario": {
                        "high": next(
                            (
                                {k: v for k, v in item.items() if k != "name_en"}
                                for item in scenarios["high"]
                                if item["name_en"] == mpa_name
                            ),
                            None,
                        ),
                        "low": next(
                            (
                                {k: v for k, v in item.items() if k != "name_en"}
                                for item in scenarios["low"]
                                if item["name_en"] == mpa_name
                            ),
                            None,
                        ),
                    },
                }
            )
    data = MarineProtectedAreasIndex.model_validate(mpas_indicator_data)
    # Dump and load shenanigans to serialize correctly all the NaN and inf to null
    # Not the best way but at least it is a way.
    return json.loads(data.model_dump_json())


def mpas_list(mpas: gpd.GeoDataFrame) -> pd.DataFrame:
    return pd.DataFrame(mpas.drop(columns="geometry"))


def clip_to_aoi_and_vectorize(
    rasters: dict[str, Callable[[], xr.DataArray]],
    grid_layer: str,
) -> gpd.GeoDataFrame:
    raster_loader = rasters[grid_layer]
    raster = raster_loader()
    geoms = [
        {"properties": {"val": v}, "geometry": s}
        for s, v in rasterio.features.shapes(
            raster.values,
            mask=raster.where(raster != raster.rio.nodata).astype(bool),
            transform=raster.rio.transform(),
        )
    ]
    polygonized_raster = gpd.GeoDataFrame.from_features(geoms)
    polygonized_raster.name = grid_layer
    return polygonized_raster


def publish_mapbox_tileset(
    gdf: gpd.GeoDataFrame, tileset_name: str, access_token: str, mapbox_username: str
) -> None:
    log = logging.getLogger(__name__)

    tileset_name = tileset_name.lower().replace("_", "-")
    tileset_id = f"{mapbox_username}.{tileset_name}"

    geojson = io.BytesIO()
    gdf.to_file(geojson, driver="GeoJSONSeq")
    # Create tileset source
    source_id = tileset_name + "-source"
    try:
        source_creation_res = httpx.post(
            f"https://api.mapbox.com/tilesets/v1/sources/{mapbox_username}/{source_id}?access_token={access_token}",
            files={
                "file": (
                    "data.geojson",
                    geojson,
                    "application/json",
                )
            },
        )
        source_creation_res.raise_for_status()
        source_creation_data = source_creation_res.json()
    except httpx.HTTPStatusError as exc:
        log.error(
            f"Error response {exc.response.status_code} with content: {exc.response.text}"
        )
        raise exc

    # Create the tileset job
    recipe = {
        "recipe": {
            "version": 1,
            "layers": {
                tileset_name: {
                    "source": source_creation_data["id"],
                    "minzoom": 0,
                    "maxzoom": 6,
                }
            },
        },
        "name": tileset_name,
    }
    try:
        tileset_creation_res = httpx.post(
            f"https://api.mapbox.com/tilesets/v1/{tileset_id}?access_token={access_token}",
            json=recipe,
        )
        tileset_creation_res.raise_for_status()
    except httpx.HTTPStatusError as exc:
        log.error(
            f"Error response {exc.response.status_code} with content: {exc.response.text}"
        )
        raise exc

    # Execute the job and publish
    try:
        publish_res = httpx.post(
            f"https://api.mapbox.com/tilesets/v1/{tileset_id}/publish?access_token={access_token}"
        )
        publish_res.raise_for_status()
    except httpx.HTTPStatusError as exc:
        log.error(
            f"Error response {exc.response.status_code} with content: {exc.response.text}"
        )
        raise exc

    log.info(publish_res.text)
