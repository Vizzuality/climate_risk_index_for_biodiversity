"""Build Cloud-Optimized GeoTIFFs (COGs) of climate risk from the
species x grid zarr cube (see `species_grid_zarr.py`).

Two products, both derived from the cube's `risk_category` variable at the
`ClimRisk` risk_indicator (categorical: 0=no data, 1=Low, 2=Moderate, 3=High,
4=Critical):

- General climate risk (`compute_general_climate_risk_cogs`): one COG per
  experiment/scenario, aggregating across all species present in each grid cell
  via majority vote (ties broken toward the higher-risk class).
- Per-species climate risk (`compute_species_climate_risk_cogs`): one COG per
  (species, experiment), with no aggregation -- just that species' own values,
  cropped to the bounding box it actually occupies.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import rasterio
import zarr
from rasterio.transform import from_origin

logger = logging.getLogger(__name__)

RISK_INDICATOR_NAME = "ClimRisk"
NODATA = 0
DTYPE = "uint8"


def _open_cube(zarr_path: str) -> zarr.Group:
    return zarr.open_group(zarr_path, mode="r")


def _risk_indicator_index(group: zarr.Group, name: str = RISK_INDICATOR_NAME) -> int:
    risk_indicators = group["risk_indicator"][:].tolist()
    return risk_indicators.index(name)


def _write_cog(
    path: Path,
    data_ascending_lat: np.ndarray,
    lat_values: np.ndarray,
    lon_values: np.ndarray,
    step: float,
) -> None:
    """Write a single-band categorical COG. `data_ascending_lat` must have rows
    ordered to match `lat_values` (ascending, south to north) -- this flips to the
    north-up row order GeoTIFF expects."""
    path.parent.mkdir(parents=True, exist_ok=True)
    north_up = np.flipud(data_ascending_lat).astype(DTYPE)
    transform = from_origin(
        lon_values.min() - step / 2, lat_values.max() + step / 2, step, step
    )
    with rasterio.open(
        path,
        "w",
        driver="COG",
        height=north_up.shape[0],
        width=north_up.shape[1],
        count=1,
        dtype=DTYPE,
        crs="EPSG:4326",
        transform=transform,
        nodata=NODATA,
        compress="DEFLATE",
        predictor=2,
    ) as dst:
        dst.write(north_up, 1)


def compute_general_climate_risk_cogs(
    zarr_path: str, output_dir: str, lat_band_size: int = 100
) -> dict:
    """One COG per experiment: per grid cell, the majority ClimRisk category
    across all species present there (ties -> higher-risk class). Cells with no
    species present anywhere stay nodata.
    """
    group = _open_cube(zarr_path)
    risk_arr = group["risk_category"]
    experiments = group["experiment"][:].tolist()
    risk_idx = _risk_indicator_index(group)
    lats = group["lat"][:]
    lons = group["lon"][:]
    step = float(group.attrs["grid_step_deg"])
    nlat, nlon = len(lats), len(lons)

    out_paths = {}
    for e_idx, experiment in enumerate(experiments):
        logger.info("Aggregating general climate risk for experiment %s", experiment)
        result = np.zeros((nlat, nlon), dtype=DTYPE)
        for lat0 in range(0, nlat, lat_band_size):
            lat1 = min(lat0 + lat_band_size, nlat)
            # shape: (species, lat_band, lon)
            band = risk_arr[e_idx, :, risk_idx, lat0:lat1, :]
            best = np.zeros(band.shape[1:], dtype=DTYPE)
            best_count = np.zeros(band.shape[1:], dtype=np.int32)
            for category in (1, 2, 3, 4):
                count = (band == category).sum(axis=0)
                take = count >= best_count
                best = np.where(take, category, best)
                best_count = np.where(take, count, best_count)
            result[lat0:lat1, :] = np.where(best_count > 0, best, NODATA)

        out_path = Path(output_dir) / f"general_climate_risk_{experiment}.tif"
        _write_cog(out_path, result, lats, lons, step)
        out_paths[experiment] = str(out_path)
        logger.info("Wrote %s", out_path)

    return {"experiments": experiments, "paths": out_paths}


def compute_species_climate_risk_cogs(
    zarr_path: str, output_dir: str, species_limit: int | None = None
) -> dict:
    """One COG per (species, experiment): that species' own ClimRisk values,
    cropped to the bounding box of cells it's actually present in. Species with
    no data at all for a given experiment are skipped.
    """
    group = _open_cube(zarr_path)
    risk_arr = group["risk_category"]
    experiments = group["experiment"][:].tolist()
    species_ids = group["species"][:].tolist()
    if species_limit is not None:
        species_ids = species_ids[:species_limit]
    risk_idx = _risk_indicator_index(group)
    lats = group["lat"][:]
    lons = group["lon"][:]
    step = float(group.attrs["grid_step_deg"])

    n_written, n_skipped = 0, 0
    for s_idx, spec_id in enumerate(species_ids):
        for e_idx, experiment in enumerate(experiments):
            data = risk_arr[e_idx, s_idx, risk_idx, :, :]
            present = data != NODATA
            if not present.any():
                n_skipped += 1
                continue

            rows = np.flatnonzero(present.any(axis=1))
            cols = np.flatnonzero(present.any(axis=0))
            row0, row1 = int(rows[0]), int(rows[-1]) + 1
            col0, col1 = int(cols[0]), int(cols[-1]) + 1
            cropped = data[row0:row1, col0:col1]

            out_path = Path(output_dir) / experiment / f"{spec_id}.tif"
            _write_cog(out_path, cropped, lats[row0:row1], lons[col0:col1], step)
            n_written += 1

        if (s_idx + 1) % 500 == 0:
            logger.info(
                "[%d/%d species] %d written, %d skipped",
                s_idx + 1,
                len(species_ids),
                n_written,
                n_skipped,
            )

    return {
        "experiments": experiments,
        "n_species": len(species_ids),
        "n_written": n_written,
        "n_skipped": n_skipped,
        "output_dir": output_dir,
    }
