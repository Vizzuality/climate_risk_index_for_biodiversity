"""Convert XYZ sonar samples to DEM.

Adaptive DEM Smoothing based on
    https://www.tandfonline.com/doi/epdf/10.1080/23729333.2017.1300998?needAccess=true
    https://github.com/MathiasGroebe/Smooth-Contours
"""

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pdal
import rasterio as rio
from scipy.ndimage import gaussian_filter

FOOT_PER_METERS = 0.3048


def masked_gaussian_filter(data: np.ma.MaskedArray, sigma: int) -> np.ma.MaskedArray:
    """Compute gaussian filter for masked array

    This function was "vibed" so take with care.
    TODO: Unvibe and implement a solid solution.
    """
    filled_data = data.filled(0)
    mask = ~data.mask
    filtered_data = gaussian_filter(filled_data, sigma=sigma)
    filtered_mask = gaussian_filter(mask.astype(float), sigma=sigma)

    with np.errstate(invalid="ignore", divide="ignore"):
        result = filtered_data / filtered_mask

    return np.ma.array(result, mask=(filtered_mask == 0))


def compute_tpi(dem_file: str) -> np.ma.MaskedArray:
    """Compute Topographic Position Index (TPI) for a given elevation raster
    using external GDAL cli tool.

    TODO: Do something to avoid disk i/o
    """
    with tempfile.NamedTemporaryFile(delete_on_close=True) as out_file:
        try:
            process = subprocess.run(
                ["gdaldem", "TPI", dem_file, out_file.name],
                capture_output=True,
                check=True,
                text=True,
            )
        except subprocess.CalledProcessError as err:
            print(err.stderr, end="")
            raise SystemExit(err.returncode)

        print(process.stdout)
        with rio.open(out_file.name) as src:
            tpi = src.read(1, masked=True)
            return tpi


def reclassify_tpi(tpi: np.ma.MaskedArray) -> np.ma.MaskedArray:
    """Reclassify TPI for adaptive bathymetry smoothing"""
    tpi = (
        np.ma.abs(tpi) * -1
    )  # in the reference they do absolute, but we are underwater so * -1
    tpi = masked_gaussian_filter(tpi, sigma=1)  # smooth
    tpi /= np.ma.min(tpi)  # normalize
    return tpi


def points_to_dem(
    points_file: str, out_file: str, *, in_srs: str, out_srs: str, resolution: float
) -> tuple[np.ma.MaskedArray, dict]:
    """Convert point cloud from non-gridded XYZ file to gridded DEM using PDAL"""

    pipeline_params = [
        {
            "filename": points_file,
            "spatialreference": "EPSG:2263",
            "type": "readers.text",
            "header": "X Y Z",
            "separator": " ",
        },
        {
            "type": "filters.reprojection",
            "in_srs": in_srs,
            "out_srs": out_srs,
        },
        {
            "filename": out_file,
            "type": "writers.gdal",
            "output_type": "max",
            "resolution": resolution,
            "radius": resolution * 2,
        },
    ]
    print("Computing DEM from point cloud...")
    pipeline = pdal.Pipeline(json.dumps(pipeline_params))
    pipeline.execute()

    with rio.open(out_file) as src:
        dem = src.read(1, masked=True)
        profile = src.profile

    return dem, profile


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=str, help="Input XYZ file path")
    parser.add_argument("output", type=str, help="Output tif file path")
    parser.add_argument(
        "--in_srs", type=str, help="Input spatial reference system", required=True
    )
    parser.add_argument(
        "--out_srs", type=str, help="Output spatial reference system", required=True
    )
    parser.add_argument(
        "-r",
        "--resolution",
        type=float,
        default=3,
        help="Resolution of the output DEM",
    )
    parser.add_argument(
        "--meters",
        action="store_true",
        help="Convert depth to meters from feet",
    )
    parser.add_argument("--smooth", action="store_true", help="Adaptive smoothing")

    args = parser.parse_args()

    input_file = Path(args.input)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file '{input_file}' does not exist.")

    with tempfile.NamedTemporaryFile(delete_on_close=True) as dem_temp_file:
        data, profile = points_to_dem(
            input_file.as_posix(),
            dem_temp_file.name,
            in_srs=args.in_srs,
            out_srs=args.out_srs,
            resolution=args.resolution,
        )
        if args.smooth:
            print("Smoothing DEM...")
            # Compute adaptive smoothing
            ctpi = reclassify_tpi(compute_tpi(dem_temp_file.name))
            smooth_1 = masked_gaussian_filter(data, sigma=1)
            smooth_2 = masked_gaussian_filter(data, sigma=3)
            # From the paper: C-DEM = C-TPI * S-DEM1 + (1 – C-TPI) * S-DEM2;
            # Where C-TPI is the normalized TPI, S-DEM1 is the smoothed DEM with sigma=1,
            #  and S-DEM2 is the smoothed DEM with sigma=3.
            data = ctpi * smooth_1 + (1 - ctpi) * smooth_2

    if args.meters:
        data *= FOOT_PER_METERS
    with rio.open(args.output, "w", **profile) as dst:
        dst.write(data, 1)


if __name__ == "__main__":
    raise SystemExit(main())
