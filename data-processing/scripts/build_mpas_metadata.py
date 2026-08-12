# /// script
# requires-python = ">=3.12"
# dependencies = ["pmtiles", "mapbox-vector-tile", "pyarrow"]
# ///
# ruff: noqa: PLR0913, T201
"""Build client/src/data/mpas_metadata.parquet from client/data/mpas.pmtiles.

One row per OBJECTID with display metadata and a lon/lat bbox, decoded from
the archive's max-zoom tiles (lower zooms drop features). NAME_E is not
unique in the source (multi-zone areas); duplicated names get an
" (OBJECTID)" suffix so the client can key routes on the name.
"""

import gzip
import math
from pathlib import Path

import mapbox_vector_tile
import pyarrow as pa
import pyarrow.parquet as pq
from pmtiles.reader import MmapSource, Reader, all_tiles

REPO_ROOT = Path(__file__).resolve().parents[2]
PMTILES_PATH = REPO_ROOT / "client" / "data" / "mpas.pmtiles"
OUT_PATH = REPO_ROOT / "client" / "src" / "data" / "mpas_metadata.parquet"
LAYER = "marine_protected_areas_2023_atlantic"
EXPECTED_FEATURES = 578


def tile_px_to_lonlat(z: int, x: int, y: int, extent: int, px: float, py: float):  # noqa
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
    if isinstance(coords[0], (int, float)):
        yield coords
    else:
        for part in coords:
            yield from iter_points(part)


def main() -> None:
    with open(PMTILES_PATH, "rb") as f:
        max_zoom = Reader(MmapSource(f)).header()["max_zoom"]

    props_by_id: dict[int, dict] = {}
    bbox_by_id: dict[int, list[float]] = {}
    tiles = 0
    with open(PMTILES_PATH, "rb") as f:
        for (z, x, y), data in all_tiles(MmapSource(f)):
            if z != max_zoom:
                continue
            tiles += 1
            if tiles % 20000 == 0:
                print(f"  {tiles} tiles scanned, {len(props_by_id)} features…")
            raw = gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data
            layer = mapbox_vector_tile.decode(raw)[LAYER]
            extent = layer["extent"]
            for feat in layer["features"]:
                oid = int(feat["properties"]["OBJECTID"])
                props_by_id.setdefault(oid, feat["properties"])
                bbox = bbox_by_id.setdefault(oid, [180.0, 90.0, -180.0, -90.0])
                for px, py in iter_points(feat["geometry"]["coordinates"]):
                    lon, lat = tile_px_to_lonlat(z, x, y, extent, px, py)
                    bbox[0] = min(bbox[0], lon)
                    bbox[1] = min(bbox[1], lat)
                    bbox[2] = max(bbox[2], lon)
                    bbox[3] = max(bbox[3], lat)

    assert len(props_by_id) == EXPECTED_FEATURES, (
        f"expected {EXPECTED_FEATURES} features, got {len(props_by_id)}"
    )

    oids_by_name: dict[str, list[int]] = {}
    for oid, props in props_by_id.items():
        oids_by_name.setdefault(props["NAME_E"], []).append(oid)
    name_by_id = {
        oid: name if len(oids) == 1 else f"{name} ({oid})"
        for name, oids in oids_by_name.items()
        for oid in oids
    }
    assert len(set(name_by_id.values())) == EXPECTED_FEATURES, (
        "name_en not unique after disambiguation"
    )

    oids = sorted(props_by_id)
    table = pa.table(
        {
            "objectid": pa.array(oids, pa.int32()),
            "name_en": pa.array([name_by_id[o] for o in oids], pa.utf8()),
            "type": pa.array([props_by_id[o].get("TYPE_E") for o in oids], pa.utf8()),
            "owner_en": pa.array(
                [props_by_id[o].get("OWNER_E") for o in oids], pa.utf8()
            ),
            "mgmt_en": pa.array(
                [props_by_id[o].get("MGMT_E") for o in oids], pa.utf8()
            ),
            "area_ha": pa.array(
                [props_by_id[o].get("O_AREA_HA") for o in oids], pa.float64()
            ),
            "bbox_xmin": pa.array([bbox_by_id[o][0] for o in oids], pa.float64()),
            "bbox_ymin": pa.array([bbox_by_id[o][1] for o in oids], pa.float64()),
            "bbox_xmax": pa.array([bbox_by_id[o][2] for o in oids], pa.float64()),
            "bbox_ymax": pa.array([bbox_by_id[o][3] for o in oids], pa.float64()),
        }
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, OUT_PATH, compression="snappy")
    print(f"wrote {table.num_rows} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
