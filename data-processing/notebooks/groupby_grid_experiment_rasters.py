import marimo

__generated_with = "0.24.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _():
    import pathlib

    import duckdb
    import numpy as np
    import polars as pl
    import rasterio
    import rioxarray  # noqa F401

    DATAPATH = pathlib.Path.cwd() / "data"
    DATASET = (
        DATAPATH / "01_raw" / "CRIB_VSEspecies_SSP126_585_2100_Canada_parquet/*.parquet"
    )
    return DATAPATH, DATASET, duckdb, np, pl, rasterio


@app.cell
def _(DATASET, pl):
    pl.scan_parquet(DATASET).collect_schema().names()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## General layer

    Average across species
    """)
    return


@app.cell
def _(DATASET, duckdb):
    con = duckdb.connect()
    data = con.read_parquet(DATASET)

    dim_cols = ["Experiment", "Lon", "Lat"]

    var_numeric_cols = [
        "Sens.TSMr",
        "Sens.RLstatus",
        "Sens.HII",
        "Sens.vind",
        "Adapt.hfrag",
        "Adapt.lmax",
        "Adapt.hrange",
        "Adapt.tvar",
        "Expo.toe",
        "Expo.vel",
        "Expo.plost",
        "Expo.nrchng",
        "ClimSens",
        "ClimAdapt",
        "ClimExpo",
        "ClimSensSD",
        "ClimAdaptSD",
        "ClimExpoSD",
        "ClimVuln",
        "ClimVulnSD",
    ]

    # Not used in the general aggregation
    # Risk thresholds need to be reaplied to the
    # avg result of the numerical variables.
    var_category_cols = [
        "ClimSensRisk",
        "ClimAdaptRisk",
        "ClimExpoRisk",
        "ClimRisk",
    ]

    result = con.execute(
        """
    SELECT
        columns(?),
        count(distinct SpecID) AS n_distinct_specid,
        avg(columns(?))
    FROM data
    GROUP BY ALL
    """,
        [dim_cols, var_numeric_cols],
    ).pl()

    var_numeric_cols.append("n_distinct_specid")
    return con, dim_cols, result, var_numeric_cols


@app.cell
def _(result):
    result.head()
    return


@app.cell
def _(con, pl):
    lon_dx = con.execute(
        """
        with x as (
            select distinct Lon
            from result
        )
        select
            Lon,
            Lon - lag(Lon) over (order by Lon) as dx
        from x
        """
    ).pl()

    lon_dx.select(pl.col("dx").mean())
    return


@app.cell
def _(DATAPATH, np, rasterio, result, var_numeric_cols):

    NODATA = -9999

    df = result.to_pandas()

    ds = (
        df.set_index(["Experiment", "Lat", "Lon"])
        .to_xarray()
        .sortby("Lat", ascending=False)  # North -> South
    )

    crs = "EPSG:4326"

    for experiment in ds.Experiment.values:
        ds_exp = ds.sel(Experiment=experiment)
        da = ds_exp[var_numeric_cols].to_array(dim="band")
        da = da.fillna(NODATA)
        da.rio.write_nodata(NODATA, inplace=True)
        da = da.rio.set_spatial_dims(x_dim="Lon", y_dim="Lat").rio.write_crs(crs)
        filename = DATAPATH / "03_primary" / f"{experiment}.tif"
        da.rio.to_raster(filename, dtype=np.float32)
        with rasterio.open(filename, "r+") as dst:
            dst.descriptions = tuple(da.band.values.astype(str))
    return (da,)


@app.cell
def _(da):
    da
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Zonal Stats

    Use marine protected areas from phase 1 as placeholder
    """)
    return


@app.cell
def _(DATAPATH):
    import geopandas as gpd
    from exactextract import exact_extract

    mpas = gpd.read_file(
        DATAPATH / "01_raw" / "marine_conservation_areas_with_regions.gpkg"
    )
    mpas = mpas.reset_index(names="id")

    cols_to_keep = mpas.columns.drop(["geometry", "year_established"]).tolist()
    mpas = mpas.to_crs("epsg:4326")
    return cols_to_keep, exact_extract, mpas


@app.cell
def _(DATAPATH, cols_to_keep, da, exact_extract, mpas, rasterio):
    from functools import partial

    from exactextract.raster import RasterioRasterSource

    band_names = da.band.values.astype(str)
    # Convert band_names to a list to query indices
    band_list = list(da.band.values.astype(str))

    clim_idx = band_list.index("ClimVuln") + 1

    experiments = (126, 585)

    def rename_col_to_band_name(keep_cols: list, s: str) -> str:
        # col names for each band is like band_1_mean, band_2_mean...
        if s in keep_cols:
            return s
        parts = s.split("_")
        if len(parts) > 1:
            return band_names[int(parts[1]) - 1]
        return s

    renamer = partial(rename_col_to_band_name, cols_to_keep)

    res = []

    for exp in experiments:
        tif_path = DATAPATH / "03_primary" / f"{exp}_fill.tif"

        zs_mean = exact_extract(
            tif_path,
            mpas,
            ops=["mean"],
            include_cols=cols_to_keep,
            output="pandas",
        ).rename(columns=renamer)

        with rasterio.open(tif_path) as src:
            # 1. Compute min & max for ClimVuln
            zs_clim = exact_extract(
                RasterioRasterSource(src, clim_idx),
                mpas,
                ops=["min", "max"],
                include_cols="id",
                output="pandas",
            ).rename(columns={"min": "ClimVuln_min", "max": "ClimVuln_max"})

        zs = zs_mean.merge(zs_clim[["id", "ClimVuln_min", "ClimVuln_max"]], on="id")

        zs["experiment"] = exp
        res.append(zs)
    return (res,)


@app.cell
def _(res):
    import pandas as pd

    all = pd.concat(res).sort_values(["id", "experiment"]).reset_index(drop=True)
    return (all,)


@app.cell
def _(all):
    all["ClimVuln"].isna().sum() // 2
    return


@app.cell
def _(all):
    all.columns
    return


@app.cell
def _(all):
    all.head()
    return


@app.cell
def _(DATAPATH, all):
    all.to_parquet(DATAPATH / "03_primary" / "mpas_stats.parquet")
    return


@app.cell
def _(DATAPATH, mpas):
    with open(DATAPATH / "03_primary" / "mpas_indexed.json", "w") as f:
        f.write(mpas.to_json(to_wgs84=True))
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Trash

    worth to keep non used snippeds
    """)
    return


@app.cell(disabled=True)
def _(DATASET, con, primary_dim):
    unique_primary_vals = con.execute(
        f"SELECT DISTINCT {primary_dim} FROM '{DATASET}' ORDER BY {primary_dim}"
    ).fetchnumpy()[primary_dim]
    return (unique_primary_vals,)


@app.cell(disabled=True)
def _(DATASET, con, other_dims):
    global_coords = {}
    for dim in other_dims:
        global_coords[dim] = con.execute(
            f"SELECT DISTINCT {dim} FROM '{DATASET}' ORDER BY {dim}"
        ).fetchnumpy()[dim]
    return (global_coords,)


@app.cell(disabled=True)
def _(
    DATASET,
    con,
    dim_cols,
    global_coords,
    out_zarr,
    primary_dim,
    unique_primary_vals,
    var_cols,
):
    # Write all dataset as zarr by slices of species (or pimary_dim)

    for i, val in enumerate(unique_primary_vals):
        df_slice = con.execute(
            f"SELECT * FROM '{DATASET}' WHERE {primary_dim} = ?", [int(val)]
        ).df()[dim_cols + var_cols]
        ds_slice = df_slice.set_index(dim_cols).to_xarray()
        # auto-pads missing cells with NaN
        ds_slice = ds_slice.reindex(global_coords)
        if i == 0:
            ds_slice.to_zarr(out_zarr, mode="w")
        else:
            ds_slice.to_zarr(out_zarr, mode="a", append_dim=primary_dim)
    return


if __name__ == "__main__":
    app.run()
