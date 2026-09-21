# /// script
# requires-python = ">=3.12"
# dependencies = ["pmtiles", "mapbox-vector-tile", "pyarrow"]
# ///
# ruff: noqa: PLR0913, PLR0917, T201
"""Build client/src/data/mpas_bbox.parquet from client/src/data/mpas.pmtiles.

One row per area `id` with a lon/lat bbox, decoded from the archive's
max-zoom tiles (lower zooms drop features). Rerun whenever the archive
is regenerated; the client joins it to mpas_stats.parquet on `id`.
"""

import gzip
import math
from pathlib import Path

import mapbox_vector_tile
import pyarrow as pa
import pyarrow.parquet as pq
from pmtiles.reader import MmapSource, Reader, all_tiles

REPO_ROOT = Path(__file__).resolve().parents[2]
PMTILES_PATH = REPO_ROOT / "client" / "src" / "data" / "mpas.pmtiles"
OUT_PATH = REPO_ROOT / "client" / "src" / "data" / "mpas_bbox.parquet"
LAYER = "mpas"


def tile_px_to_lonlat(z: int, x: int, y: int, extent: int, px: float, py: float):
    # clamp to the tile so buffer geometry doesn't bleed into the bbox
    px = min(max(px, 0), extent)
    py = min(max(py, 0), extent)
    n = 2**z
    lon = (x + px / extent) / n * 360.0 - 180.0
    # mapbox_vector_tile decodes y-up: py=0 is the tile's south edge
    y_global = y + 1 - py / extent
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y_global / n))))
    return lon, lat


def iter_points(coords):
    if isinstance(coords[0], int | float):
        yield coords
    else:
        for part in coords:
            yield from iter_points(part)


def main() -> None:
    with open(PMTILES_PATH, "rb") as f:
        reader = Reader(MmapSource(f))
        max_zoom = reader.header()["max_zoom"]
        expected = next(
            layer["count"]
            for layer in reader.metadata()["tilestats"]["layers"]
            if layer["layer"] == LAYER
        )

    bbox_by_id: dict[int, list[float]] = {}
    tiles = 0
    with open(PMTILES_PATH, "rb") as f:
        for (z, x, y), data in all_tiles(MmapSource(f)):
            if z != max_zoom:
                continue
            tiles += 1
            if tiles % 20000 == 0:
                print(f"  {tiles} tiles scanned, {len(bbox_by_id)} features…")
            raw = gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data
            layer = mapbox_vector_tile.decode(raw).get(LAYER)
            if layer is None:
                continue
            extent = layer["extent"]
            for feat in layer["features"]:
                fid = int(feat["properties"]["id"])
                bbox = bbox_by_id.setdefault(fid, [180.0, 90.0, -180.0, -90.0])
                for px, py in iter_points(feat["geometry"]["coordinates"]):
                    lon, lat = tile_px_to_lonlat(z, x, y, extent, px, py)
                    bbox[0] = min(bbox[0], lon)
                    bbox[1] = min(bbox[1], lat)
                    bbox[2] = max(bbox[2], lon)
                    bbox[3] = max(bbox[3], lat)

    assert len(bbox_by_id) == expected, (
        f"expected {expected} features, got {len(bbox_by_id)}"
    )

    ids = sorted(bbox_by_id)
    table = pa.table(
        {
            # string to match the `id` column of mpas_stats.parquet
            "id": pa.array([str(i) for i in ids], pa.utf8()),
            "bbox_xmin": pa.array([bbox_by_id[i][0] for i in ids], pa.float64()),
            "bbox_ymin": pa.array([bbox_by_id[i][1] for i in ids], pa.float64()),
            "bbox_xmax": pa.array([bbox_by_id[i][2] for i in ids], pa.float64()),
            "bbox_ymax": pa.array([bbox_by_id[i][3] for i in ids], pa.float64()),
        }
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, OUT_PATH, compression="snappy")
    print(f"wrote {table.num_rows} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
