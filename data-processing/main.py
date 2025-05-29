import argparse
from pathlib import Path
from typing import Literal

import numpy
import polars as pl
import polars.selectors as cs
import rasterio as rio
from rasterio.transform import from_origin


def pivot_to_raster(df: pl.DataFrame, column: str) -> numpy.ndarray:
    df = df.sort("Lat", descending=True)
    p = df.pivot(on="Lon", index="Lat", values=column).drop("Lat")
    # Resort the columns by numeric value because pivot messes it up
    p = p.select([str(a) for a in sorted(float(e) for e in p.columns)])
    return p.to_numpy()


def write_raster(
    df: pl.DataFrame,
    column: str,
    out_path: Path,
    experiment: Literal["low", "high"],
    north: float,
    west: float,
) -> None:
    data = pivot_to_raster(df, column)
    transform = from_origin(north=north, west=west, xsize=1, ysize=1)
    with rio.open(
        out_path / f"{column.replace('.', '_')}-{experiment}.tif",
        "w",
        driver="GTiff",
        height=data.shape[0],
        width=data.shape[1],
        count=1,
        dtype=data.dtype,
        crs="+proj=latlong",
        transform=transform,
        tiled=True,
        blocksize=(512, 512),
    ) as dst:
        dst.write(data, 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", type=str, help="Input file path")
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        help="Output file path. If does not exist, it will be created.",
    )
    args = parser.parse_args()

    input_file = Path(args.input)
    if not input_file.exists():
        raise ValueError("Input file does not exist")

    output_path = Path(args.output)
    if not output_path.exists():
        output_path.mkdir(parents=True)

    print("Reading input file...")
    df = pl.scan_csv(input_file)
    df = df.group_by("Lat", "Lon", "Experiment").agg(cs.float().median()).collect()

    experiment_low = df.filter(pl.col("Experiment") == 2.6)
    experiment_high = df.filter(pl.col("Experiment") == 8.5)

    indicator_columns = df.select(cs.float().exclude("Lat", "Lon", "Experiment")).columns

    northest = df.select(pl.col("Lat").max()).item()
    westest = df.select(pl.col("Lon").min()).item()

    for column in indicator_columns:
        print(f"Processing column: {column}")
        experiment_low.select("Lat", "Lon", column).sort("Lat", descending=True)
        experiment_high.select("Lat", "Lon", column).sort("Lat", descending=True)
        write_raster(
            experiment_low,
            column,
            out_path=output_path,
            experiment="low",
            north=northest,
            west=westest,
        )
        write_raster(
            experiment_high,
            column,
            out_path=output_path,
            experiment="high",
            north=northest,
            west=westest,
        )


if __name__ == "__main__":
    raise SystemExit(main())
