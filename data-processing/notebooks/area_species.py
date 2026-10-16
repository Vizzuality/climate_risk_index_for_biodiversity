import marimo

__generated_with = "0.25.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Species within each conservation area

    One row per area, experiment and species, with the species' ClimVuln
    weighted by its distribution in the area. Sorted by area so the client can
    read a single area's rows with range requests.
    """)
    return


@app.cell
def _(mo):
    import duckdb
    import geopandas as gpd
    import pandas as pd
    import rasterio
    from exactextract import exact_extract
    from exactextract.raster import RasterioRasterSource

    DATAPATH = mo.notebook_dir().parent / "data"
    DATASET = (
        DATAPATH / "01_raw" / "CRIB_VSEspecies_SSP126_585_2100_Canada_parquet/*.parquet"
    )
    EXPERIMENTS = (126, 585)
    return (
        DATAPATH,
        DATASET,
        EXPERIMENTS,
        RasterioRasterSource,
        duckdb,
        exact_extract,
        gpd,
        pd,
        rasterio,
    )


@app.cell
def _(DATAPATH, gpd):
    # Same ids as mpas_stats.parquet (see groupby_grid_experiment_rasters)
    mpas = (
        gpd.read_file(
            DATAPATH
            / "02_intermediate"
            / "marine_conservation_areas_with_regions.gpkg",
            columns=["geometry"],
        )
        .reset_index(names="id")
        .to_crs("epsg:4326")
    )
    return (mpas,)


@app.cell
def _(
    DATAPATH,
    EXPERIMENTS,
    RasterioRasterSource,
    exact_extract,
    mpas,
    pd,
    rasterio,
):
    # An area uses the valid cells of the dilated ClimVuln band (exactextract
    # skips nodata), like the zonal stats in mpas_stats.parquet.
    _area_cells = []
    for _exp in EXPERIMENTS:
        with rasterio.open(DATAPATH / "02_intermediate" / f"{_exp}_fill.tif") as _src:
            _cells = exact_extract(
                RasterioRasterSource(_src, _src.descriptions.index("ClimVuln") + 1),
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
    return (area_cells,)


@app.cell
def _(DATAPATH, DATASET, area_cells, duckdb):
    con = duckdb.connect()
    # The joins spill to disk instead of taking most of the RAM
    con.execute("SET memory_limit = '8GB'")
    con.register("area_cells", area_cells)

    # Cells with data keep their own species; cells filled by the dilation
    # borrow them from their valid 8-neighbours weighted by 1/d, the same rule
    # fillnodata applies. Grid indices come from the 0.05° pixel centers
    # (k * 0.05 + 0.025). Row groups of ~10 areas keep a single area's read small.
    con.execute(
        f"""
        COPY (
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
            -- Mean over the whole area, so a species scores by both its ClimVuln
            -- and the share of the area it occupies
            scores AS (
                SELECT
                    cs.id,
                    cs.experiment,
                    cs.SpecID,
                    sum(sw.coverage * cs.wv / sw.w) / any_value(a.coverage) AS score
                FROM cell_species cs
                JOIN source_weights sw USING (id, experiment, gi, gj)
                JOIN area_coverage a USING (id, experiment)
                GROUP BY cs.id, cs.experiment, cs.SpecID
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
                s.id,
                s.experiment,
                CAST(s.SpecID AS INTEGER) AS species_id,
                n.common_name,
                n.scientific_name,
                CAST(s.score AS FLOAT) AS score
            FROM scores s
            JOIN names n USING (SpecID)
            ORDER BY s.id, s.experiment, s.score DESC, s.SpecID
        ) TO '{DATAPATH / "03_primary" / "area_species.parquet"}'
            (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 20480)
        """,
        {"dataset": str(DATASET)},
    )
    return (con,)


@app.cell
def _(DATAPATH, con):
    con.sql(
        f"SELECT * FROM '{DATAPATH / '03_primary' / 'area_species.parquet'}' LIMIT 10"
    ).pl()
    return


if __name__ == "__main__":
    app.run()
