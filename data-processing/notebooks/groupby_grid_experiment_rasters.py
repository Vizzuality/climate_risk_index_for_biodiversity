import marimo

__generated_with = "0.25.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _(mo):
    import duckdb
    import numpy as np
    import polars as pl
    import rasterio
    import rioxarray  # noqa F401

    DATAPATH = mo.notebook_dir().parent / "data"
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
    from rasterio.fill import fillnodata

    NODATA = -9999

    RES = 0.05

    # Round away float noise so coords match the regular grid below
    df = result.to_pandas().round({"Lat": 3, "Lon": 3})

    # Pixel-center coords of the full grid; lats run North -> South. Reindexing
    # keeps rows/cols missing from the data as NaN instead of dropping them,
    # which would shift the raster's geotransform.
    lats = np.round(np.arange(df.Lat.max(), df.Lat.min() - RES / 2, -RES), 3)
    lons = np.round(np.arange(df.Lon.min(), df.Lon.max() + RES / 2, RES), 3)
    ds = (
        df.set_index(["Experiment", "Lat", "Lon"])
        .to_xarray()
        .reindex(Lat=lats, Lon=lons)
    )

    crs = "EPSG:4326"

    for experiment in ds.Experiment.values:
        ds_exp = ds.sel(Experiment=experiment)
        da = ds_exp[var_numeric_cols].to_array(dim="band")
        da = da.fillna(NODATA)
        da.rio.write_nodata(NODATA, inplace=True)
        # Rename instead of rio.set_spatial_dims: that setting lives on the
        # accessor and is lost on copy(), while x/y dims are found by default
        da = da.rename(Lon="x", Lat="y").rio.write_crs(crs)
        # Dilate valid pixels one cell (diagonals included) into nodata
        dilated = np.stack(
            [
                fillnodata(
                    band,
                    mask=band != NODATA,
                    max_search_distance=1.5,
                    smoothing_iterations=0,
                )
                for band in da.values.astype(np.float32)
            ]
        )
        filename = DATAPATH / "02_intermediate" / f"{experiment}_fill.tif"
        da.copy(data=dilated).rio.to_raster(filename, dtype=np.float32)
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
        DATAPATH / "02_intermediate" / "marine_conservation_areas_with_regions.gpkg"
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
        tif_path = DATAPATH / "02_intermediate" / f"{exp}_fill.tif"

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
    return RasterioRasterSource, clim_idx, experiments, res


@app.cell
def _(res):
    import pandas as pd

    all = pd.concat(res).sort_values(["id", "experiment"]).reset_index(drop=True)
    return all, pd


@app.cell
def _(
    DATAPATH,
    DATASET,
    RasterioRasterSource,
    clim_idx,
    con,
    exact_extract,
    experiments,
    mpas,
    pd,
    rasterio,
):
    # Top 5 species per area and experiment, ranked by ClimVuln weighted by
    # the species' distribution in the area. An area uses the valid cells of
    # the dilated ClimVuln band (exactextract skips nodata), like the zonal
    # stats. Cells with data keep their own species; cells filled by the
    # dilation borrow them from their valid 8-neighbours weighted by 1/d, the
    # same rule fillnodata applies.
    _area_cells = []
    for _exp in experiments:
        with rasterio.open(DATAPATH / "02_intermediate" / f"{_exp}_fill.tif") as _src:
            _cells = exact_extract(
                RasterioRasterSource(_src, clim_idx),
                mpas,
                ops=["center_x", "center_y", "coverage"],
                include_cols="id",
                output="pandas",
            )
        _area_cells.append(
            _cells.explode(["center_x", "center_y", "coverage"]).assign(experiment=_exp)
        )
    area_cells = (
        pd.concat(_area_cells)
        .dropna(subset=["center_x"])
        .astype({"center_x": float, "center_y": float, "coverage": float})
    )
    con.register("area_cells", area_cells)

    # Grid indices from the 0.05° pixel centers (k * 0.05 + 0.025)
    top_species = con.execute(
        """
        WITH species AS (
            SELECT
                CAST(Experiment AS INTEGER) AS experiment,
                CAST(round(Lon / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(Lat / 0.05 - 0.5) AS INTEGER) AS gj,
                SpecID,
                ClimVuln
            FROM read_parquet($dataset)
            WHERE ClimVuln IS NOT NULL
        ),
        valid AS (SELECT DISTINCT experiment, gi, gj FROM species),
        cells AS (
            SELECT
                id,
                experiment,
                coverage,
                CAST(round(center_x / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(center_y / 0.05 - 0.5) AS INTEGER) AS gj
            FROM area_cells
        ),
        area_coverage AS (
            SELECT id, experiment, sum(coverage) AS coverage
            FROM cells
            GROUP BY id, experiment
        ),
        offsets AS (
            SELECT di, dj, 1 / sqrt(di * di + dj * dj) AS w
            FROM range(-1, 2) t1(di), range(-1, 2) t2(dj)
            WHERE di <> 0 OR dj <> 0
        ),
        -- Valid cells are their own source; filled cells take their valid
        -- 8-neighbours weighted by 1/d
        sources AS (
            SELECT id, experiment, gi, gj, coverage, gi AS src_gi, gj AS src_gj, 1.0 AS w
            FROM cells SEMI JOIN valid USING (experiment, gi, gj)
            UNION ALL
            SELECT f.id, f.experiment, f.gi, f.gj, f.coverage, v.gi, v.gj, o.w
            FROM (SELECT * FROM cells ANTI JOIN valid USING (experiment, gi, gj)) f
            CROSS JOIN offsets o
            JOIN valid v
                ON v.experiment = f.experiment
                AND v.gi = f.gi + o.di
                AND v.gj = f.gj + o.dj
        ),
        source_weights AS (
            SELECT id, experiment, gi, gj, any_value(coverage) AS coverage, sum(w) AS w
            FROM sources
            GROUP BY id, experiment, gi, gj
        ),
        -- A species' ClimVuln in a cell, counting its absence from a source as 0
        cell_species AS (
            SELECT s.id, s.experiment, s.gi, s.gj, sp.SpecID, sum(s.w * sp.ClimVuln) AS wv
            FROM sources s
            JOIN species sp
                ON sp.experiment = s.experiment
                AND sp.gi = s.src_gi
                AND sp.gj = s.src_gj
            GROUP BY s.id, s.experiment, s.gi, s.gj, sp.SpecID
        ),
        -- Mean over the whole area, so a species scores by both its ClimVuln and
        -- the share of the area it occupies
        ranked AS (
            SELECT
                cs.id,
                cs.experiment,
                cs.SpecID,
                sum(sw.coverage * cs.wv / sw.w) / any_value(a.coverage) AS score,
                row_number() OVER (
                    PARTITION BY cs.id, cs.experiment ORDER BY score DESC, cs.SpecID
                ) AS rnk
            FROM cell_species cs
            JOIN source_weights sw USING (id, experiment, gi, gj)
            JOIN area_coverage a USING (id, experiment)
            GROUP BY cs.id, cs.experiment, cs.SpecID
            QUALIFY rnk <= 5
        ),
        names AS (
            SELECT
                SpecID,
                any_value(NULLIF(Comname, '')) AS common_name,
                any_value(SPname) AS scientific_name
            FROM read_parquet($dataset)
            GROUP BY SpecID
        )
        SELECT
            r.id,
            r.experiment,
            list(
                struct_pack(
                    id := r.SpecID,
                    common_name := n.common_name,
                    scientific_name := n.scientific_name,
                    score := r.score
                )
                ORDER BY r.rnk
            ) AS top_species
        FROM ranked r
        JOIN names n USING (SpecID)
        GROUP BY r.id, r.experiment
        """,
        {"dataset": str(DATASET)},
    ).df()
    return (top_species,)


@app.cell
def _(top_species):
    top_species.head()
    return


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
def _(DATAPATH, all, top_species):
    import json

    # bbox arrives as a JSON string from the GPKG; store it as list<double>
    all.assign(bbox=all["bbox"].map(json.loads)).merge(
        top_species, on=["id", "experiment"], how="left"
    ).to_parquet(DATAPATH / "03_primary" / "mpas_stats.parquet")
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
