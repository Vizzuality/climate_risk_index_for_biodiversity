# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "rasterio", "scipy"]
# ///
"""Adaptive bathymetry smoothing.

Takes a DEM, keeps only the cells below sea level (land is set to nodata) and
flips them into positive depths, then blends a lightly smoothed DEM (sigma=1) with a strongly smoothed one (sigma=3),
weighted by the normalized, smoothed absolute TPI, so rugged terrain keeps its
detail while flat areas get the heavy smoothing:

    C-DEM = C-TPI * S-DEM1 + (1 - C-TPI) * S-DEM2

Based on
    https://www.tandfonline.com/doi/epdf/10.1080/23729333.2017.1300998?needAccess=true
    https://github.com/MathiasGroebe/Smooth-Contours

The raster is processed in tiles so it never has to fit in memory, and tiles
that are all land are skipped. Each tile is read with a halo of extra pixels so
the filters see the same neighbours they would on the full raster, and the TPI
is normalized by its global maximum (computed in a first pass) so there are no
seams between tiles.
"""

import argparse
from pathlib import Path

import numpy as np
import rasterio as rio
from rasterio.windows import Window
from scipy.ndimage import gaussian_filter

TILE_SIZE = 512
# Must cover the widest filter reach: gaussian_filter truncates at 4 sigma, so
# sigma=3 reaches 12 px (TPI + sigma=1 reaches 1 + 4 px).
HALO = 16


def masked_gaussian_filter(data: np.ma.MaskedArray, sigma: float) -> np.ma.MaskedArray:
    """Gaussian filter that ignores masked cells (normalized convolution).

    Masked cells contribute nothing and the kernel weights are renormalized
    over the valid cells, so nodata doesn't bleed into the result. The output
    keeps the input mask.
    """
    valid = ~np.ma.getmaskarray(data)
    blurred = gaussian_filter(data.filled(0), sigma=sigma)
    weights = gaussian_filter(valid.astype(np.float64), sigma=sigma)

    with np.errstate(invalid="ignore", divide="ignore"):
        return np.ma.array(blurred / weights, mask=~valid)


def compute_tpi(dem: np.ma.MaskedArray) -> np.ma.MaskedArray:
    """Topographic Position Index, as in `gdaldem TPI`: each cell minus the
    mean of its 8 neighbours. Masked neighbours are ignored and isolated cells
    (no valid neighbours) are treated as flat."""
    height, width = dem.shape
    values = np.pad(dem.filled(0), 1)
    valid = np.pad(~np.ma.getmaskarray(dem), 1)

    total = np.zeros(dem.shape)
    count = np.zeros(dem.shape)
    for dy in range(3):
        for dx in range(3):
            if dy == dx == 1:
                continue
            total += values[dy : dy + height, dx : dx + width]
            count += valid[dy : dy + height, dx : dx + width]

    with np.errstate(invalid="ignore", divide="ignore"):
        tpi = np.where(count > 0, dem.filled(0) - total / count, 0)
    return np.ma.array(tpi, mask=np.ma.getmaskarray(dem))


def smoothed_abs_tpi(dem: np.ma.MaskedArray) -> np.ma.MaskedArray:
    """Absolute TPI smoothed with sigma=1 (C-TPI before normalization)."""
    return masked_gaussian_filter(np.ma.abs(compute_tpi(dem)), sigma=1)


def adaptive_smooth(dem: np.ma.MaskedArray, tpi_max: float) -> np.ma.MaskedArray:
    ctpi = smoothed_abs_tpi(dem) / tpi_max
    smooth_1 = masked_gaussian_filter(dem, sigma=1)
    smooth_3 = masked_gaussian_filter(dem, sigma=3)
    return ctpi * smooth_1 + (1 - ctpi) * smooth_3


def tiles(height: int, width: int):
    """Yield (read window, core window) for each tile, where the read window is
    the core expanded by the halo and clipped to the raster."""
    for row in range(0, height, TILE_SIZE):
        for col in range(0, width, TILE_SIZE):
            core = Window(
                col, row, min(TILE_SIZE, width - col), min(TILE_SIZE, height - row)
            )
            top, left = max(row - HALO, 0), max(col - HALO, 0)
            bottom = min(row + core.height + HALO, height)
            right = min(col + core.width + HALO, width)
            yield Window(left, top, right - left, bottom - top), core


def crop_to_core(data: np.ma.MaskedArray, read: Window, core: Window):
    row, col = core.row_off - read.row_off, core.col_off - read.col_off
    return data[row : row + core.height, col : col + core.width]


def smooth_dem(input_file: Path, output_file: Path) -> None:
    with rio.open(input_file) as src:
        nodata = src.nodata if src.nodata is not None else -32767

        def read_depth(window: Window) -> np.ma.MaskedArray:
            dem = src.read(1, window=window, masked=True).astype(np.float64)
            return np.ma.masked_where(dem >= 0, -dem)

        def sea_tiles():
            for read, core in tiles(src.height, src.width):
                depth = read_depth(read)
                if not np.ma.getmaskarray(crop_to_core(depth, read, core)).all():
                    yield depth, read, core

        print("Computing TPI range...")
        tpi_max = 0.0
        for depth, read, core in sea_tiles():
            # Only the core: the halo edges see a truncated neighbourhood.
            core_tpi = crop_to_core(smoothed_abs_tpi(depth), read, core)
            tpi_max = max(tpi_max, float(np.ma.max(core_tpi)))

        profile = src.profile | {
            "driver": "GTiff",
            "dtype": "float32",
            "nodata": nodata,
            "tiled": True,
            "blockxsize": TILE_SIZE,
            "blockysize": TILE_SIZE,
            "compress": "deflate",
            "predictor": 3,
            "BIGTIFF": "IF_SAFER",
        }

        print("Smoothing depth...")
        with rio.open(output_file, "w", **profile) as dst:
            # Skipped land tiles are never written; GDAL fills them with nodata.
            for depth, read, core in sea_tiles():
                smoothed = crop_to_core(adaptive_smooth(depth, tpi_max), read, core)
                dst.write(smoothed.filled(nodata).astype(np.float32), 1, window=core)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("input", type=Path, help="Input DEM raster path")
    parser.add_argument("output", type=Path, help="Output smoothed depth tif path")
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input file '{args.input}' does not exist.")

    smooth_dem(args.input, args.output)


if __name__ == "__main__":
    raise SystemExit(main())
