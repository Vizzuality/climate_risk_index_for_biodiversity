"""Build a single analysis-ready zarr cube from the partitioned species x grid-cell
climate risk parquet dataset.

Source data shape
------------------
The source is a collection of parquet files, each holding rows of
``(Experiment, SpecID, Lat, Lon, <indicator columns...>)``. There is one row per
*(climate scenario, species, 0.05deg grid cell)* combination the species is present
in — most species only occupy a small fraction of the full domain, so the table is
long and sparse (hundreds of millions of rows) rather than a dense grid.

Target shape
-------------
A zarr group with dims ``(experiment, species, lat, lon)`` (plus an ``indicator`` /
``risk_indicator`` axis folded into two stacked data variables, see below), so that:

- Zonal stats over a polygon are a plain ``lat``/``lon`` slice + mask (e.g. via
  rioxarray/exactextract), same as with the existing per-indicator GeoTIFF rasters.
- Aggregating across species, scenario, or indicator is a normal xarray
  ``.sel()`` / ``.mean(dim=...)`` — no need to re-read parquet to change the
  aggregation.

Because each species only occupies a small bounding box, the cube is stored with
``write_empty_chunks=False`` and a chunk size of 1 along ``species``: chunks that
would be entirely fill-value (no data for that species/scenario/region) are never
written to disk, so the on-disk footprint tracks actual data density rather than the
full logical (species x lat x lon) volume.

Two stacked data variables (rather than ~24 separate ones) keep the chunk count
manageable, since each stacked write covers all indicators for a given
species/scenario/region in one chunk:

- ``value`` float32, dims ``(experiment, species, indicator, lat, lon)`` — the
  continuous indicator columns (``Sens.*``, ``Adapt.*``, ``Expo.*``, ``Clim*``).
- ``risk_category`` int8, dims ``(experiment, species, risk_indicator, lat, lon)`` —
  the categorical risk columns (``ClimSensRisk``, ``ClimAdaptRisk``, ``ClimExpoRisk``,
  ``ClimRisk``), encoded ``0=no data, 1=Low, 2=Moderate, 3=High, 4=Critical``.

Species-level attributes that are constant per species (``SPname``, ``Comname``,
``THabitat``) and per species+scenario (``PrpMiss``) are stored as small auxiliary
coordinate arrays aligned to the ``species`` dimension rather than gridded.
"""

from __future__ import annotations

import glob
import logging
from dataclasses import dataclass

import numpy as np
import polars as pl
import pyarrow.parquet as pq
import zarr

logger = logging.getLogger(__name__)

# Continuous indicator columns -> stored in the "value" array, in this fixed order.
INDICATOR_COLUMNS = [
    "Sens.TSMr",
    "Sens.RLstatus",
    "Sens.HII",
    "Sens.vind",
    "Adapt.hfrag",
    "Adapt.lmax",
    "Adapt.hrange",
    "Adapt.tvar",
    "Expo.toe",
    "Expo.vel",
    "Expo.plost",
    "Expo.nrchng",
    "ClimSens",
    "ClimAdapt",
    "ClimExpo",
    "ClimSensSD",
    "ClimAdaptSD",
    "ClimExpoSD",
    "ClimVuln",
    "ClimVulnSD",
]

# Categorical risk columns -> stored in the "risk_category" array, in this fixed order.
RISK_COLUMNS = [
    "ClimSensRisk",
    "ClimAdaptRisk",
    "ClimExpoRisk",
    "ClimRisk",
]

# NOTE: conf/base/parameters_processing.yml's `grid_risk_categorical_map` (N/M/H/C ->
# 1..4) does not match the actual data, which stores the full words below. 0 is
# reserved for "no data" (source value was null).
RISK_CATEGORY_MAP = {"Low": 1, "Moderate": 2, "High": 3, "Critical": 4}

GRID_STEP_DEG = 0.05
ID_COLUMNS = [
    "Experiment",
    "SpecID",
    "SPname",
    "Comname",
    "THabitat",
    "Lat",
    "Lon",
    "PrpMiss",
]


@dataclass(frozen=True)
class GridIndex:
    """Canonical (lat, lon) grid derived from the data's bounding box, at a fixed
    0.05deg step. Grid cells with no data anywhere in the source stay as fill_value
    (and, thanks to write_empty_chunks, are never materialized on disk)."""

    lat0: float
    lon0: float
    step: float
    nlat: int
    nlon: int

    @property
    def lats(self) -> np.ndarray:
        return self.lat0 + np.arange(self.nlat) * self.step

    @property
    def lons(self) -> np.ndarray:
        return self.lon0 + np.arange(self.nlon) * self.step

    def lat_index(self, lat: np.ndarray) -> np.ndarray:
        return np.round((lat - self.lat0) / self.step).astype(np.int64)

    def lon_index(self, lon: np.ndarray) -> np.ndarray:
        return np.round((lon - self.lon0) / self.step).astype(np.int64)


def discover_grid_index(parquet_glob: str, step: float = GRID_STEP_DEG) -> GridIndex:
    """Compute the global lat/lon bounding box from parquet row-group statistics
    (metadata only — this does not read any row data, so it's cheap even over
    hundreds of millions of rows)."""
    lat_min, lat_max = np.inf, -np.inf
    lon_min, lon_max = np.inf, -np.inf
    files = sorted(glob.glob(parquet_glob))
    if not files:
        raise FileNotFoundError(f"No parquet files matched {parquet_glob!r}")
    for fp in files:
        meta = pq.ParquetFile(fp).metadata
        for rg_idx in range(meta.num_row_groups):
            rg = meta.row_group(rg_idx)
            for col_idx in range(rg.num_columns):
                col = rg.column(col_idx)
                if col.path_in_schema == "Lat" and col.statistics is not None:
                    lat_min = min(lat_min, col.statistics.min)
                    lat_max = max(lat_max, col.statistics.max)
                elif col.path_in_schema == "Lon" and col.statistics is not None:
                    lon_min = min(lon_min, col.statistics.min)
                    lon_max = max(lon_max, col.statistics.max)
    nlat = round((lat_max - lat_min) / step) + 1
    nlon = round((lon_max - lon_min) / step) + 1
    return GridIndex(lat0=lat_min, lon0=lon_min, step=step, nlat=nlat, nlon=nlon)


def discover_species_catalog(parquet_glob: str) -> pl.DataFrame:
    """Scan just the species-attribute columns to build the species dimension's
    coordinate table, sorted by SpecID. Raises if an attribute assumed constant per
    species (SPname/Comname/THabitat) actually varies, since that would break the
    "gridded value + small species lookup" split this cube relies on."""
    lf = pl.scan_parquet(parquet_glob).select(
        "SpecID", "SPname", "Comname", "THabitat", "Experiment", "PrpMiss"
    )

    invariants = (
        lf.group_by("SpecID")
        .agg(
            pl.col("SPname").n_unique().alias("n_spname"),
            pl.col("Comname").n_unique().alias("n_comname"),
            pl.col("THabitat").n_unique().alias("n_thabitat"),
        )
        .filter(
            (pl.col("n_spname") > 1)
            | (pl.col("n_comname") > 1)
            | (pl.col("n_thabitat") > 1)
        )
        .collect(engine="streaming")
    )
    if invariants.height:
        raise ValueError(
            "SPname/Comname/THabitat are not constant per SpecID for "
            f"{invariants.height} species, e.g.: {invariants.head(5)}"
        )

    species = (
        lf.group_by("SpecID")
        .agg(
            pl.col("SPname").first(),
            pl.col("Comname").first(),
            pl.col("THabitat").first(),
        )
        .sort("SpecID")
        .collect(engine="streaming")
    )

    prp_miss = (
        lf.select("SpecID", "Experiment", "PrpMiss")
        .unique()
        .collect(engine="streaming")
        .pivot("Experiment", index="SpecID", values="PrpMiss")
    )
    return species.join(prp_miss, on="SpecID", how="left").sort("SpecID")


def discover_experiments(parquet_glob: str) -> list[str]:
    lf = pl.scan_parquet(parquet_glob).select("Experiment").unique()
    return sorted(lf.collect(engine="streaming")["Experiment"].to_list())


@dataclass(frozen=True)
class ChunkConfig:
    """Chunk sizes along the `species` and `lat`/`lon` axes of the gridded arrays.
    See the module docstring for why a small species chunk matters for sparsity."""

    species: int = 1
    spatial: int = 100


def create_zarr_store(
    zarr_path: str,
    grid: GridIndex,
    species: pl.DataFrame,
    experiments: list[str],
    chunks: ChunkConfig = ChunkConfig(),
) -> zarr.Group:
    """Allocate the zarr group and its (empty, fill-valued) arrays. Nothing but
    coordinates is written yet; `ingest_parquet_file` fills in actual data."""
    group = zarr.open_group(zarr_path, mode="w")

    n_exp, n_sp, n_ind, n_risk = (
        len(experiments),
        species.height,
        len(INDICATOR_COLUMNS),
        len(RISK_COLUMNS),
    )
    chunk_cfg = {"write_empty_chunks": False}

    group.create_array(
        "value",
        shape=(n_exp, n_sp, n_ind, grid.nlat, grid.nlon),
        chunks=(1, chunks.species, n_ind, chunks.spatial, chunks.spatial),
        dtype="f4",
        fill_value=np.nan,
        dimension_names=("experiment", "species", "indicator", "lat", "lon"),
        config=chunk_cfg,
    )
    group.create_array(
        "risk_category",
        shape=(n_exp, n_sp, n_risk, grid.nlat, grid.nlon),
        chunks=(1, chunks.species, n_risk, chunks.spatial, chunks.spatial),
        dtype="i1",
        fill_value=0,
        dimension_names=("experiment", "species", "risk_indicator", "lat", "lon"),
        config=chunk_cfg,
    )

    group.create_array("lat", data=grid.lats.astype("f8"), dimension_names=("lat",))
    group.create_array("lon", data=grid.lons.astype("f8"), dimension_names=("lon",))
    group.create_array(
        "experiment", data=np.array(experiments), dimension_names=("experiment",)
    )
    group.create_array(
        "indicator",
        data=np.array(INDICATOR_COLUMNS, dtype="U32"),
        dimension_names=("indicator",),
    )
    group.create_array(
        "risk_indicator",
        data=np.array(RISK_COLUMNS, dtype="U32"),
        dimension_names=("risk_indicator",),
    )

    group.create_array(
        "species",
        data=species["SpecID"].to_numpy().astype("i4"),
        dimension_names=("species",),
    )
    group.create_array(
        "species_name",
        data=np.array(species["SPname"].to_list(), dtype=str),
        dimension_names=("species",),
    )
    group.create_array(
        "species_common_name",
        data=np.array(species["Comname"].to_list(), dtype=str),
        dimension_names=("species",),
    )
    group.create_array(
        "species_habitat",
        data=species["THabitat"].to_numpy().astype("i4"),
        dimension_names=("species",),
    )
    prp_miss = np.stack(
        [species[exp].fill_null(np.nan).to_numpy() for exp in experiments], axis=1
    )
    group.create_array(
        "species_prop_missing",
        data=prp_miss.astype("f4"),
        dimension_names=("species", "experiment"),
    )

    group.attrs["risk_category_map"] = {"no_data": 0, **RISK_CATEGORY_MAP}
    group.attrs["experiment_description"] = {
        "126": "SSP1-2.6 (low emissions)",
        "585": "SSP5-8.5 (high emissions)",
    }
    group.attrs["grid_step_deg"] = grid.step
    return group


def ingest_parquet_file(
    filepath: str,
    group: zarr.Group,
    grid: GridIndex,
    experiment_index: dict[str, int],
    species_index: dict[int, int],
) -> int:
    """Read one source parquet file and scatter its rows into the zarr cube.

    Rows are grouped by (Experiment, SpecID) so each write only touches the small
    lat/lon bounding box that species actually occupies in this file, and merged
    with whatever is already on disk (via a read-modify-write) so re-running or
    processing files in any order is safe: a value already written by another file
    is never clobbered with a fill value.
    """
    value_arr = group["value"]
    risk_arr = group["risk_category"]

    df = pl.read_parquet(
        filepath,
        columns=[
            "Experiment",
            "SpecID",
            "Lat",
            "Lon",
            *INDICATOR_COLUMNS,
            *RISK_COLUMNS,
        ],
    )
    n_rows_ingested = 0
    for (experiment, spec_id), rows in df.group_by(["Experiment", "SpecID"]):
        e = experiment_index[experiment]
        s = species_index[spec_id]

        lat_idx = grid.lat_index(rows["Lat"].to_numpy())
        lon_idx = grid.lon_index(rows["Lon"].to_numpy())
        lat_lo, lat_hi = int(lat_idx.min()), int(lat_idx.max()) + 1
        lon_lo, lon_hi = int(lon_idx.min()), int(lon_idx.max()) + 1
        rel_lat, rel_lon = lat_idx - lat_lo, lon_idx - lon_lo

        block = np.full(
            (len(INDICATOR_COLUMNS), lat_hi - lat_lo, lon_hi - lon_lo),
            np.nan,
            dtype="f4",
        )
        for i, col in enumerate(INDICATOR_COLUMNS):
            block[i, rel_lat, rel_lon] = rows[col].to_numpy()
        existing = value_arr[e, s, :, lat_lo:lat_hi, lon_lo:lon_hi]
        value_arr[e, s, :, lat_lo:lat_hi, lon_lo:lon_hi] = np.where(
            np.isnan(block), existing, block
        )

        risk_block = np.zeros(
            (len(RISK_COLUMNS), lat_hi - lat_lo, lon_hi - lon_lo), dtype="i1"
        )
        for i, col in enumerate(RISK_COLUMNS):
            codes = (
                rows[col]
                .replace(RISK_CATEGORY_MAP)
                .fill_null(0)
                .to_numpy()
                .astype("i1")
            )
            risk_block[i, rel_lat, rel_lon] = codes
        existing_risk = risk_arr[e, s, :, lat_lo:lat_hi, lon_lo:lon_hi]
        risk_arr[e, s, :, lat_lo:lat_hi, lon_lo:lon_hi] = np.where(
            risk_block == 0, existing_risk, risk_block
        )

        n_rows_ingested += rows.height
    return n_rows_ingested


def build_species_grid_cube(
    parquet_glob: str,
    zarr_path: str,
    chunks: ChunkConfig = ChunkConfig(),
    file_limit: int | None = None,
) -> dict:
    """End-to-end build: discover schema, allocate the zarr store, then stream each
    source parquet file into it. Safe to re-run against the same zarr_path (files
    are merged, not overwritten-then-lost) but a fresh `zarr_path` is recommended
    for a from-scratch rebuild since `create_zarr_store` opens in "w" (overwrite)
    mode.
    """
    files = sorted(glob.glob(parquet_glob))
    if not files:
        raise FileNotFoundError(f"No parquet files matched {parquet_glob!r}")
    if file_limit is not None:
        files = files[:file_limit]

    logger.info("Discovering grid bounds from %d files", len(files))
    grid = discover_grid_index(parquet_glob)
    logger.info("Grid: %d x %d cells", grid.nlat, grid.nlon)

    logger.info("Discovering species catalog")
    species = discover_species_catalog(parquet_glob)
    experiments = discover_experiments(parquet_glob)
    logger.info("%d species, experiments=%s", species.height, experiments)

    group = create_zarr_store(
        zarr_path,
        grid,
        species,
        experiments,
        chunks=chunks,
    )
    experiment_index = {e: i for i, e in enumerate(experiments)}
    species_index = {sid: i for i, sid in enumerate(species["SpecID"].to_list())}

    total_rows = 0
    for i, fp in enumerate(files):
        n = ingest_parquet_file(fp, group, grid, experiment_index, species_index)
        total_rows += n
        logger.info(
            "[%d/%d] %s: %d rows (%d total)", i + 1, len(files), fp, n, total_rows
        )

    return {
        "zarr_path": zarr_path,
        "n_files": len(files),
        "n_rows": total_rows,
        "n_species": species.height,
        "experiments": experiments,
        "shape_lat_lon": [grid.nlat, grid.nlon],
    }
