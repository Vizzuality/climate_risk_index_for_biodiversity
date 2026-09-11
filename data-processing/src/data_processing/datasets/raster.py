"""A single multi-band GeoTIFF, written from an xarray DataArray."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import rasterio
import rioxarray  # noqa: F401 (registers the `.rio` xarray accessor)
import xarray as xr
from kedro.io.core import AbstractDataset


class RasterDataset(AbstractDataset[xr.DataArray, str]):
    """Writes an `(band, y, x)` `xr.DataArray` to a GeoTIFF via rioxarray,
    tagging it with a CRS and naming each band after the `band` coordinate.

    `load()` returns the file path rather than pixel data: the libraries
    this project reads rasters with (`rasterio`, `exact_extract`) work off a
    path directly, so there's no need to read the whole raster into memory
    just to hand back a path.

    One raster per file, so this is meant to be wrapped in a
    `partitions.PartitionedDataset` whenever a pipeline produces more than
    one (e.g. one per climate experiment) — that key set is only known once
    the node runs, not at catalog-authoring time.
    """

    def __init__(self, *, filepath: str, crs: str = "EPSG:4326") -> None:
        self._filepath = filepath
        self._crs = crs

    def save(self, data: xr.DataArray) -> None:
        Path(self._filepath).parent.mkdir(parents=True, exist_ok=True)
        da = data.rio.write_crs(self._crs)
        da.rio.to_raster(self._filepath)
        with rasterio.open(self._filepath, "r+") as dst:
            dst.descriptions = tuple(da["band"].values.astype(str))

    def load(self) -> str:
        return self._filepath

    def _describe(self) -> dict[str, Any]:
        return {"filepath": self._filepath, "crs": self._crs}

    def _exists(self) -> bool:
        return Path(self._filepath).exists()
