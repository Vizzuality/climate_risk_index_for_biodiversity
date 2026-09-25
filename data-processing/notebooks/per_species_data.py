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

    var_category_cols = [
        "ClimSensRisk",
        "ClimAdaptRisk",
        "ClimExpoRisk",
        "ClimRisk",
    ]
    return con, var_numeric_cols


@app.cell
def _(con):
    con.execute("select * from data limit 10").pl()
    return


@app.cell
def _(con, pl):
    lon_dx = con.execute(
        """
        with x as (
            select distinct Lon
            from data
        )
        select
            Lon,
            Lon - lag(Lon) over (order by Lon) as dx
        from x
        """
    ).pl()

    RES = float(lon_dx.select(pl.col("dx").mean()).item())
    return (RES,)


@app.cell
def _(con):
    species_ids = con.execute(
        """
        select
            distinct(SpecID)
        from data
        """
    ).fetchnumpy()
    species_ids
    return (species_ids,)


@app.cell
def _(DATAPATH, RES, con, mo, np, rasterio, species_ids, var_numeric_cols):
    for spec_id in mo.status.progress_bar(species_ids["SpecID"].tolist()):
        df = con.execute("select * from data where SpecID=?", [spec_id]).df()
        ds = df.set_index(["Experiment", "Lat", "Lon"]).to_xarray()

        # to_xarray() only creates coords for the Lon/Lat values the species
        # occupies, so gaps in its range drop whole columns/rows and rioxarray
        # then infers a stretched resolution. Reindex onto a regular RES grid
        # spanning the species bbox so gaps become nodata cells instead.
        # "nearest" + tolerance absorbs float noise in the source coords.
        lon_min, lon_max = float(ds.Lon.min()), float(ds.Lon.max())
        lat_min, lat_max = float(ds.Lat.min()), float(ds.Lat.max())
        n_lon = round((lon_max - lon_min) / RES) + 1
        n_lat = round((lat_max - lat_min) / RES) + 1
        ds = ds.reindex(
            Lon=lon_min + np.arange(n_lon) * RES,
            Lat=lat_max - np.arange(n_lat) * RES,  # North -> South
            method="nearest",
            tolerance=RES / 4,
        )

        crs = "EPSG:4326"

        # Build the transform explicitly from the known grid resolution instead
        # of letting rioxarray infer it from coordinate spacing: species with a
        # single occurrence pixel have width/height == 1 along Lon/Lat, which
        # makes rioxarray unable to compute a resolution and silently fall back
        # to an identity transform (i.e. the pixel gets written at lon=0, lat=0).
        transform = rasterio.transform.from_origin(
            lon_min - RES / 2, lat_max + RES / 2, RES, RES
        )

        for experiment in ds.Experiment.values:
            ds_exp = ds.sel(Experiment=experiment)

            da = ds_exp[var_numeric_cols].to_array(dim="band")

            NODATA_VAL = -9999.0
            da = da.fillna(NODATA_VAL)
            da = da.rio.write_nodata(NODATA_VAL)

            da = da.rio.set_spatial_dims(x_dim="Lon", y_dim="Lat").rio.write_crs(crs)
            da.rio.write_transform(transform, inplace=True)
            filename = (
                DATAPATH
                / "02_intermediate"
                / "species_fixed"
                / f"{spec_id}_{experiment}.tif"
            )
            filename.parent.mkdir(exist_ok=True)

            da.rio.to_raster(
                filename,
                dtype=np.float32,
                sparse_ok="on",
                tiled="yes",
                compress="ZSTD",
                predictor="3",
            )
            with rasterio.open(filename, "r+") as dst:
                dst.descriptions = tuple(da.band.values.astype(str))
    return


@app.cell
def _(con):
    con.execute("select * from data where SpecID=130044").pl()
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
