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
    # Per species stats and ClimVuln COGs

    One row per species and experiment with the mean of every indicator over
    the species' range (plus ClimVuln min and max), in the same columns as
    `mpas_stats.parquet`. Sorted by species so the client can read a single
    species' rows with range requests.

    Also writes one float ClimVuln COG per species and experiment.
    """)
    return


@app.cell
def _(mo):
    import subprocess
    from concurrent.futures import ThreadPoolExecutor

    import duckdb

    DATAPATH = mo.notebook_dir().parent / "data"
    DATASET = (
        DATAPATH / "01_raw" / "CRIB_VSEspecies_SSP126_585_2100_Canada_parquet/*.parquet"
    )
    SPECIES_RASTERS = sorted(
        (DATAPATH / "02_intermediate" / "species_fixed").glob("*.tif")
    )
    COG_DIR = DATAPATH / "03_primary" / "species_climvuln"
    return (
        COG_DIR,
        DATAPATH,
        DATASET,
        SPECIES_RASTERS,
        ThreadPoolExecutor,
        duckdb,
        subprocess,
    )


@app.cell
def _(DATAPATH, DATASET, duckdb):
    con = duckdb.connect()

    # Plain mean of every indicator over the species' cells, like the zonal
    # stats in mpas_stats.parquet. 256 species per row group: filtering on
    # species_id alone prunes row groups by their stats, so one species costs
    # a single row group read.
    con.execute(
        f"""
        COPY (
            SELECT
                CAST(SpecID AS INTEGER) AS species_id,
                CAST(Experiment AS INTEGER) AS experiment,
                any_value(NULLIF(Comname, '')) AS common_name,
                any_value(SPname) AS scientific_name,
                CAST(
                    avg(COLUMNS('^(Sens|Adapt|Expo)\\.|^Clim(Sens|Adapt|Expo|Vuln)(SD)?$'))
                    AS FLOAT
                ),
                CAST(min(ClimVuln) AS FLOAT) AS ClimVuln_min,
                CAST(max(ClimVuln) AS FLOAT) AS ClimVuln_max
            FROM read_parquet($dataset)
            GROUP BY species_id, experiment
            ORDER BY species_id, experiment
        ) TO '{DATAPATH / "03_primary" / "species_stats.parquet"}'
            (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 512)
        """,
        {"dataset": str(DATASET)},
    )
    return (con,)


@app.cell
def _(DATAPATH, con):
    con.sql(
        f"SELECT * FROM '{DATAPATH / '03_primary' / 'species_stats.parquet'}' LIMIT 10"
    ).pl()
    return


@app.cell
def _(COG_DIR, SPECIES_RASTERS, ThreadPoolExecutor, mo, subprocess):
    # ClimVuln (0-1) as float, same tiling as the scenario COGs. nodata -9999
    # comes from the species rasters.
    def to_cog(path):
        subprocess.run(
            [
                "gdal",
                "raster",
                "pipeline",
                "!",
                "read",
                str(path),
                "!",
                "select",
                "--band",
                "19",
                "!",
                "write",
                "-f",
                "COG",
                "--co",
                "COMPRESS=DEFLATE",
                "--co",
                "PREDICTOR=YES",
                "--co",
                "RESAMPLING=NEAREST",
                "--co",
                "TILING_SCHEME=GoogleMapsCompatible",
                "--co",
                "ZOOM_LEVEL_STRATEGY=UPPER",
                "--overwrite",
                "--quiet",
                str(COG_DIR / f"{path.stem}_climvuln_cog.tif"),
            ],
            check=True,
            capture_output=True,
        )

    COG_DIR.mkdir(exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as _pool:
        for _ in mo.status.progress_bar(
            _pool.map(to_cog, SPECIES_RASTERS),
            total=len(SPECIES_RASTERS),
            title="ClimVuln COGs",
        ):
            pass
    return


if __name__ == "__main__":
    app.run()
