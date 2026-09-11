import numpy as np
import rasterio
import rioxarray  # noqa: F401 (registers the `.rio` xarray accessor)
import xarray as xr
from kedro_datasets.partitions import PartitionedDataset

from data_processing.datasets import RasterDataset


def _band_data_array(values: dict[str, np.ndarray]) -> xr.DataArray:
    da = xr.concat(
        [xr.DataArray(v, dims=["Lat", "Lon"], name=k) for k, v in values.items()],
        dim=xr.DataArray(list(values), dims="band", name="band"),
    )
    # `set_spatial_dims` must be the last op: it tags the returned object's
    # own `.rio` accessor, and ops like `assign_coords` return a new object
    # that wouldn't carry that tag.
    return da.assign_coords(Lat=[0.0, 1.0], Lon=[0.0, 1.0]).rio.set_spatial_dims(
        x_dim="Lon", y_dim="Lat"
    )


def test_save_writes_a_geotiff_with_named_bands_and_crs(tmp_path):
    da = _band_data_array(
        {"a": np.array([[1, 2], [3, 4]]), "b": np.array([[5, 6], [7, 8]])}
    )
    filepath = str(tmp_path / "raster.tif")

    RasterDataset(filepath=filepath).save(da)

    with rasterio.open(filepath) as src:
        assert src.descriptions == ("a", "b")
        assert src.count == len(src.descriptions)
        assert src.crs.to_string() == "EPSG:4326"


def test_load_returns_the_filepath():
    dataset = RasterDataset(filepath="some/path.tif")
    assert dataset.load() == "some/path.tif"


def test_partitioned_dataset_round_trips_one_file_per_experiment(tmp_path):
    # This is what the `general_layer_rasters` catalog entry does under the
    # hood: a node returns {experiment: DataArray}, PartitionedDataset saves
    # each through RasterDataset, and loading it back hands the zonal-stats
    # node {experiment: callable-returning-path}.
    rasters = {
        "126": _band_data_array({"ClimVuln": np.array([[1, 2], [3, 4]])}),
        "585": _band_data_array({"ClimVuln": np.array([[5, 6], [7, 8]])}),
    }
    dataset = PartitionedDataset(
        path=str(tmp_path / "general_layer_rasters"),
        dataset={"type": "data_processing.datasets.RasterDataset"},
        filename_suffix=".tif",
    )

    dataset.save(rasters)
    loaded = dataset.load()

    assert set(loaded) == {"126", "585"}
    with rasterio.open(loaded["126"]()) as src:
        assert src.descriptions == ("ClimVuln",)
