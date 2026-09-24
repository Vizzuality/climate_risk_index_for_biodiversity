"""Nodes for the 'processing' pipeline."""

import geopandas as gpd
import numpy as np
import pandas as pd
import rioxarray  # noqa: F401  (registers the .rio accessor)
import xarray as xr
from exactextract import exact_extract
from ibis.expr.types import Table
from rasterio.fill import fillnodata


def aggregate_species_grid(
    species_grid: Table,
    dim_cols: list[str],
    numeric_cols: list[str],
) -> Table:
    """Average numeric grid variables across species, by grid cell and experiment"""
    return species_grid.group_by(dim_cols).aggregate(
        n_distinct_specid=species_grid.SpecID.nunique(),
        **{col: species_grid[col].mean() for col in numeric_cols},
    )


def grid_summary_to_raster(
    grid_summary: Table,
    experiment: int,
    numeric_cols: list[str],
    crs: str,
) -> xr.DataArray:
    """Pivot one experiment's grid summary into a multi-band raster"""
    band_cols = [*numeric_cols, "n_distinct_specid"]

    df = grid_summary.filter(grid_summary.Experiment == str(experiment)).to_pandas()
    da = (
        df.set_index(["Lat", "Lon"])[band_cols]
        .to_xarray()
        .rename({"Lon": "x", "Lat": "y"})
        .sortby("y", ascending=False)  # North -> South
        .to_array(dim="band")
    )
    da = da.fillna(-9999).astype("float32")
    da.rio.write_nodata(-9999, inplace=True)
    return da.rio.write_crs(crs)


def fill_raster_nodata(
    raster: xr.DataArray,
) -> xr.DataArray:
    """Dilate every band"""
    nodata = raster.rio.nodata
    # fillnodata fills its input in place
    filled = np.stack(
        [
            fillnodata(band, mask=band != nodata, max_search_distance=1.5)
            for band in raster.values.copy()
        ]
    )
    return raster.copy(data=filled).assign_coords(band=list(raster.attrs["long_name"]))


def index_conservation_areas(areas: gpd.GeoDataFrame, crs: str) -> gpd.GeoDataFrame:
    return areas.to_crs(crs).reset_index(names="id")  # type: ignore


def compute_zonal_stats(
    areas: gpd.GeoDataFrame,
    raster: xr.DataArray,
    experiment: int,
) -> pd.DataFrame:
    band_names = list(raster.attrs["long_name"])
    # exactextract reads "id" from the GeoJSON feature id, which geopandas
    # fills with str(index): index by id and cast back
    stats = exact_extract(
        raster,
        areas,
        ops=["mean", "min", "max"],
        include_cols=["id"],
        output="pandas",
    )
    stats["id"] = stats["id"].astype(int)
    # exactextract names multiband columns `band_<n>_<op>`
    renames = {f"band_{i}_mean": name for i, name in enumerate(band_names, start=1)}
    vuln = band_names.index("ClimVuln") + 1
    renames |= {f"band_{vuln}_min": "ClimVuln_min", f"band_{vuln}_max": "ClimVuln_max"}
    stats = stats[["id", *renames]].rename(columns=renames)
    stats["experiment"] = experiment
    return stats


def build_area_stats(
    areas: gpd.GeoDataFrame,
    *experiment_stats: pd.DataFrame,
) -> pd.DataFrame:
    attributes = pd.DataFrame(areas.drop(columns=["geometry", "year_established"]))
    stats = pd.concat(experiment_stats, ignore_index=True)
    return (
        attributes.merge(stats, on="id", validate="one_to_many")
        .sort_values(["id", "experiment"])
        .reset_index(drop=True)
    )
