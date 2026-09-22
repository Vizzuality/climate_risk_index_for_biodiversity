"""Nodes for the 'processing' pipeline."""

import rioxarray  # noqa: F401  (registers the .rio accessor)
import xarray as xr
from ibis.expr.types import Table


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
    nodata: float,
    crs: str,
) -> xr.DataArray:
    """Pivot one experiment's grid summary into a multi-band raster.

    Bands are the averaged ``numeric_cols`` plus ``n_distinct_specid``.
    """
    band_cols = [*numeric_cols, "n_distinct_specid"]

    df = grid_summary.filter(grid_summary.Experiment == str(experiment)).to_pandas()
    da = (
        df.set_index(["Lat", "Lon"])[band_cols]
        .to_xarray()
        .rename({"Lon": "x", "Lat": "y"})
        .sortby("y", ascending=False)  # North -> South
        .to_array(dim="band")
    )
    da = da.fillna(nodata).astype("float32")
    da.rio.write_nodata(nodata, inplace=True)
    return da.rio.write_crs(crs)
