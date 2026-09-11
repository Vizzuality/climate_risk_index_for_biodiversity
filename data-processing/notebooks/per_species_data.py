import marimo

__generated_with = "0.24.1"
app = marimo.App(width="medium")


@app.cell
def _():

    return


@app.cell
def _():
    import pathlib

    import duckdb
    import numpy as np
    import polars as pl
    import rasterio

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

    lon_dx.select(pl.col("dx").mean())


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
def _(DATAPATH, con, np, rasterio, species_ids, var_numeric_cols):
    for spec_id in species_ids["SpecID"].tolist():
        df = con.execute("select * from data where SpecID=?", [spec_id]).df()
        ds = (
            df.set_index(["Experiment", "Lat", "Lon"])
            .to_xarray()
            .sortby("Lat", ascending=False)  # North -> South
        )

        crs = "EPSG:4326"

        for experiment in ds.Experiment.values:
            ds_exp = ds.sel(Experiment=experiment)

            da = ds_exp[var_numeric_cols].to_array(dim="band")

            NODATA_VAL = -9999.0
            da = da.fillna(NODATA_VAL)
            da = da.rio.write_nodata(NODATA_VAL)

            da = da.rio.set_spatial_dims(x_dim="Lon", y_dim="Lat").rio.write_crs(crs)
            filename = (
                DATAPATH / "03_primary" / "species" / f"{spec_id}_{experiment}.tif"
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


@app.cell
def _(con):
    con.execute("select * from data where SpecID=130044").pl()


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
