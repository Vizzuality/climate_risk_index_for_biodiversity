import geopandas as gpd
import pandas as pd
import polars as pl
import pytest
import rioxarray  # noqa: F401 (registers the `.rio` xarray accessor)
from shapely.geometry import box

from data_processing.datasets import DuckDBParquetGlobDataset, RasterDataset
from data_processing.pipelines.processing.nodes import (
    aggregate_species_risk,
    compute_mpa_zonal_stats,
    write_general_layer_rasters,
)
from data_processing.pipelines.processing.pipeline import create_pipeline

DIM_COLS = ["Experiment", "Lon", "Lat"]
VAR_NUMERIC_COLS = ["ClimVuln", "ClimSens"]


def test_create_pipeline_has_the_three_expected_nodes():
    pipe = create_pipeline()
    assert [n.name for n in pipe.nodes] == [
        "aggregate_species_risk",
        "write_general_layer_rasters",
        "compute_mpa_zonal_stats",
    ]


@pytest.fixture
def species_risk_raw(tmp_path):
    # Two species, two grid cells: averaging across SpecID should collapse
    # the two species into one row per cell.
    df = pl.DataFrame(
        {
            "SpecID": [1, 2, 1, 2],
            "Experiment": ["126", "126", "126", "126"],
            "Lon": [0.0, 0.0, 1.0, 1.0],
            "Lat": [0.0, 0.0, 0.0, 0.0],
            "ClimVuln": [1.0, 3.0, 2.0, 4.0],
            "ClimSens": [10.0, 20.0, 30.0, 40.0],
        }
    )
    df.write_parquet(tmp_path / "raw.parquet")
    return DuckDBParquetGlobDataset(filepath=str(tmp_path / "*.parquet")).load()


def test_aggregate_species_risk_averages_across_species(species_risk_raw):
    result = aggregate_species_risk(species_risk_raw, DIM_COLS, VAR_NUMERIC_COLS)

    assert result.sort("Lon").to_dicts() == [
        {
            "Experiment": "126",
            "Lon": 0.0,
            "Lat": 0.0,
            "n_distinct_specid": 2,
            "ClimVuln": 2.0,
            "ClimSens": 15.0,
        },
        {
            "Experiment": "126",
            "Lon": 1.0,
            "Lat": 0.0,
            "n_distinct_specid": 2,
            "ClimVuln": 3.0,
            "ClimSens": 35.0,
        },
    ]


@pytest.fixture
def general_layer():
    # Shaped like `aggregate_species_risk`'s output: it always adds
    # n_distinct_specid alongside the requested numeric columns. A 2x2 grid
    # per experiment so rioxarray can infer a real (non-degenerate) transform.
    lon = [0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0]
    lat = [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0]
    return pl.DataFrame(
        {
            "Experiment": ["126"] * 4 + ["585"] * 4,
            "Lon": lon,
            "Lat": lat,
            "ClimVuln": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
            "ClimSens": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0],
            "n_distinct_specid": [2] * 8,
        }
    )


def test_write_general_layer_rasters_returns_one_data_array_per_experiment(
    general_layer,
):
    rasters = write_general_layer_rasters(general_layer, ["ClimVuln", "ClimSens"])

    assert set(rasters) == {"126", "585"}
    da = rasters["126"]
    assert list(da["band"].values) == ["ClimVuln", "ClimSens", "n_distinct_specid"]
    assert da.rio.x_dim == "Lon"
    assert da.rio.y_dim == "Lat"


def test_compute_mpa_zonal_stats(tmp_path, general_layer):
    rasters = write_general_layer_rasters(general_layer, ["ClimVuln", "ClimSens"])
    # mirrors what a `partitions.PartitionedDataset` of `RasterDataset` would
    # hand the node: a mapping of partition id -> callable loading the path.
    general_layer_rasters = {}
    for experiment, da in rasters.items():
        dataset = RasterDataset(filepath=str(tmp_path / f"{experiment}.tif"))
        dataset.save(da)
        general_layer_rasters[experiment] = dataset.load

    mpas = gpd.GeoDataFrame(
        {"OBJECTID": [1]}, geometry=[box(-0.5, -0.5, 1.5, 0.5)], crs="EPSG:4326"
    )

    stats = compute_mpa_zonal_stats(mpas, general_layer_rasters)

    assert isinstance(stats, pd.DataFrame)
    assert set(stats["experiment"]) == {"126", "585"}
    assert {"ClimVuln", "ClimSens", "ClimVuln_min", "ClimVuln_max"} <= set(
        stats.columns
    )
