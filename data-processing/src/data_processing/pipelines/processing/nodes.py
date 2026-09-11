"""Nodes for the 'processing' pipeline.

Reproduces the first-iteration workflow from
``notebooks/first_iteration_layers.py``:

1. average per-species climate-risk indicators into a general layer,
   grouped by experiment and grid cell (:func:`aggregate_species_risk`).
2. write that general layer to one multi-band GeoTIFF per experiment
   (:func:`write_general_layer_rasters`).
3. compute zonal statistics of those rasters over marine protected areas
   (:func:`compute_mpa_zonal_stats`).

Datasets (the raw parquet glob, the per-experiment rasters, the mpas
polygons) are all catalog entries — see ``conf/base/catalog.yml`` and
``data_processing.datasets``. Nodes only take ``params:`` for actual
configuration (column names, band to threshold on), never for data
locations.
"""

from __future__ import annotations

from collections.abc import Callable

import duckdb
import geopandas as gpd
import pandas as pd
import polars as pl
import rasterio
import rioxarray  # noqa: F401 (registers the `.rio` xarray accessor)
import xarray as xr
from exactextract import exact_extract
from exactextract.raster import RasterioRasterSource


def aggregate_species_risk(
    species_risk_raw: duckdb.DuckDBPyRelation,
    dim_cols: list[str],
    var_numeric_cols: list[str],
) -> pl.DataFrame:
    """Average per-species climate-risk indicators into a general layer.

    Groups by ``dim_cols`` (experiment + grid cell) and averages every
    column in ``var_numeric_cols`` across species, keeping a count of
    distinct species contributing to each cell.
    """
    return species_risk_raw.query(
        "data",
        """
        SELECT
            columns([{cols}]),
            count(distinct SpecID) AS n_distinct_specid,
            avg(columns([{var_cols}]))
        FROM data
        GROUP BY ALL
        """.format(
            cols=", ".join(f"'{c}'" for c in dim_cols),
            var_cols=", ".join(f"'{c}'" for c in var_numeric_cols),
        ),
    ).pl()


def write_general_layer_rasters(
    general_layer: pl.DataFrame,
    var_numeric_cols: list[str],
) -> dict[str, xr.DataArray]:
    """Build one multi-band `(band, Lat, Lon)` raster per experiment.

    Returns a mapping of experiment -> ``DataArray``, meant to be saved
    through the ``general_layer_rasters`` catalog entry (a
    ``partitions.PartitionedDataset`` of ``RasterDataset``), which handles
    writing each one to its own GeoTIFF.
    """
    band_cols = [*var_numeric_cols, "n_distinct_specid"]

    ds = (
        general_layer.to_pandas()
        .set_index(["Experiment", "Lat", "Lon"])
        .to_xarray()
        .sortby("Lat", ascending=False)  # North -> South
    )

    return {
        str(experiment): ds.sel(Experiment=experiment)[band_cols]
        .to_array(dim="band")
        .rio.set_spatial_dims(x_dim="Lon", y_dim="Lat")
        for experiment in ds.Experiment.values
    }


def compute_mpa_zonal_stats(
    mpas: gpd.GeoDataFrame,
    general_layer_rasters: dict[str, Callable[[], str]],
    clim_vuln_band: str = "ClimVuln",
) -> pd.DataFrame:
    """Zonal statistics of the general layer rasters over ``mpas`` polygons.

    Computes the mean of every band, plus min/max of ``clim_vuln_band``
    specifically, for each experiment raster in ``general_layer_rasters``
    (as loaded from the ``PartitionedDataset`` catalog entry: a mapping of
    experiment -> a callable that loads the raster's file path).
    """
    per_experiment = []
    for experiment, load_raster in general_layer_rasters.items():
        tif_path = load_raster()

        with rasterio.open(tif_path) as src:
            band_names = src.descriptions  # one name per band, in band order
            clim_idx = band_names.index(clim_vuln_band) + 1

            def rename_col_to_band_name(col: str, band_names=band_names) -> str:
                # exact_extract names columns like "band_1_mean", "band_2_mean"...
                parts = col.split("_")
                return band_names[int(parts[1]) - 1] if len(parts) > 1 else col

            zs_mean = exact_extract(
                tif_path,
                mpas,
                ops=["mean"],
                include_cols="OBJECTID",
                output="pandas",
            ).rename(columns=rename_col_to_band_name)

            zs_clim = exact_extract(
                RasterioRasterSource(src, clim_idx),
                mpas,
                ops=["min", "max"],
                include_cols="OBJECTID",
                output="pandas",
            ).rename(
                columns={
                    "min": f"{clim_vuln_band}_min",
                    "max": f"{clim_vuln_band}_max",
                }
            )

        zs = zs_mean.merge(
            zs_clim[["OBJECTID", f"{clim_vuln_band}_min", f"{clim_vuln_band}_max"]],
            on="OBJECTID",
        )
        zs["experiment"] = experiment
        per_experiment.append(zs)

    return (
        pd.concat(per_experiment)
        .sort_values(["OBJECTID", "experiment"])
        .reset_index(drop=True)
    )
