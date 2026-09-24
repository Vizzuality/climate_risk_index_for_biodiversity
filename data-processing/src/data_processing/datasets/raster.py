import rasterio
from kedro.io.core import get_filepath_str
from kedro_datasets_experimental.rioxarray import GeoTIFFDataset
from xarray import DataArray


class RasterDataset(GeoTIFFDataset):
    """``GeoTIFFDataset`` that writes multiband rasters via ``rioxarray``
    instead of the base class's ``_save_multiband``, which reconstructs the
    affine transform with ``from_bounds(west=data.x.min(), ...)`` — treating
    pixel-center coordinates as bounding-box edges. That understates the
    resolution by a factor of (n-1)/n and shifts the origin by half a pixel.
    ``rioxarray`` derives the transform correctly from the coordinate
    spacing itself, the same way the base class's single-band path already
    does. Also writes band descriptions from the ``band`` coordinate, which
    the base class doesn't do at all.
    """

    def save(self, data: DataArray) -> None:
        self._sanity_check(data)
        save_path = get_filepath_str(self._get_save_path(), self._protocol)
        data.rio.to_raster(save_path, **self._save_args)
        self._fs.invalidate_cache(save_path)

        if "band" in data.dims:
            band_names = tuple(str(v) for v in data.band.values)
            with rasterio.open(save_path, "r+") as dst:
                dst.descriptions = band_names
