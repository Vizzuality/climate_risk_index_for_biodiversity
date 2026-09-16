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
    return


@app.cell
def _(con):
    # used to apply fix to single pixel rasters

    species_ids_one_pixel = con.execute(
        """
        SELECT
            SpecID
        FROM data
        GROUP BY SpecID
        HAVING count(*)=2
        """
    ).fetchnumpy()
    len(species_ids_one_pixel["SpecID"])
    return (species_ids_one_pixel,)


@app.cell
def _(
    DATAPATH,
    RES,
    con,
    np,
    rasterio,
    species_ids_one_pixel,
    var_numeric_cols,
):
    for spec_id in species_ids_one_pixel["SpecID"].tolist():
        df = con.execute("select * from data where SpecID=?", [spec_id]).df()
        ds = (
            df.set_index(["Experiment", "Lat", "Lon"])
            .to_xarray()
            .sortby("Lat", ascending=False)  # North -> South
        )

        crs = "EPSG:4326"

        # Build the transform explicitly from the known grid resolution instead
        # of letting rioxarray infer it from coordinate spacing: species with a
        # single occurrence pixel have width/height == 1 along Lon/Lat, which
        # makes rioxarray unable to compute a resolution and silently fall back
        # to an identity transform (i.e. the pixel gets written at lon=0, lat=0).
        lon0 = float(ds.Lon.min())
        lat0 = float(ds.Lat.max())
        transform = rasterio.transform.from_origin(
            lon0 - RES / 2, lat0 + RES / 2, RES, RES
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
