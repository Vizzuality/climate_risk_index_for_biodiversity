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

    One row per area, experiment and species with the mean of every indicator
    over the species' cells in the area, in the same columns as
    `mpas_stats.parquet`. Written sorted by area and by species so the client
    can read a single area's or species' rows with range requests.
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
    SPECIES_PER_AREA = DATAPATH / "03_primary" / "species_per_area.parquet"
    AREAS_PER_SPECIES = DATAPATH / "03_primary" / "areas_per_species.parquet"
    EXPERIMENTS = (126, 585)

    # The joins spill to disk instead of taking most of the RAM
    duckdb.execute("SET memory_limit = '8GB'")
    return (
        AREAS_PER_SPECIES,
        DATAPATH,
        DATASET,
        EXPERIMENTS,
        RasterioRasterSource,
        SPECIES_PER_AREA,
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
                ops=["center_x", "center_y"],
                include_cols="id",
                output="pandas",
            )
        _area_cells.append(
            _cells.explode(["center_x", "center_y"]).assign(experiment=_exp)
        )
    area_cells = (
        pd.concat(_area_cells)
        .dropna(subset=["center_x"])
        .astype({"center_x": float, "center_y": float})
    )
    return (area_cells,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Cells with data keep their own species; cells filled by the dilation take
    them from their valid 8-neighbours, the cells fillnodata read from. Grid
    indices come from the 0.05° pixel centers (k * 0.05 + 0.025).
    """)
    return


@app.cell
def _(DATASET, area_cells, mo):
    _df = mo.sql(
        f"""
        CREATE OR REPLACE TABLE area_sources AS
        WITH valid AS (
            SELECT DISTINCT
                CAST(Experiment AS INTEGER) AS experiment,
                CAST(round(Lon / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(Lat / 0.05 - 0.5) AS INTEGER) AS gj
            FROM read_parquet('{DATASET}')
            WHERE ClimVuln IS NOT NULL
        ),
        cells AS (
            SELECT DISTINCT
                id,
                experiment,
                CAST(round(center_x / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(center_y / 0.05 - 0.5) AS INTEGER) AS gj
            FROM area_cells
        ),
        offsets AS (
            SELECT di, dj
            FROM range(-1, 2) t1(di), range(-1, 2) t2(dj)
            WHERE di <> 0 OR dj <> 0
        )
        SELECT id, experiment, gi, gj
        FROM cells SEMI JOIN valid USING (experiment, gi, gj)
        UNION
        SELECT f.id, f.experiment, v.gi, v.gj
        FROM (SELECT * FROM cells ANTI JOIN valid USING (experiment, gi, gj)) f
        CROSS JOIN offsets o
        JOIN valid v
            ON v.experiment = f.experiment
            AND v.gi = f.gi + o.di
            AND v.gj = f.gj + o.dj
        """
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Plain mean of every indicator over the species' cells in the area.
    """)
    return


@app.cell
def _(DATASET, area_sources, mo):
    _df = mo.sql(
        f"""
        CREATE OR REPLACE TABLE area_species_stats AS
        WITH species AS (
            SELECT
                CAST(Experiment AS INTEGER) AS experiment,
                CAST(round(Lon / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(Lat / 0.05 - 0.5) AS INTEGER) AS gj,
                * EXCLUDE (Experiment, Lon, Lat)
            FROM read_parquet('{DATASET}')
            WHERE ClimVuln IS NOT NULL
        )
        SELECT
            id,
            experiment,
            CAST(SpecID AS INTEGER) AS species_id,
            any_value(NULLIF(Comname, '')) AS common_name,
            any_value(SPname) AS scientific_name,
            CAST(
                avg(COLUMNS('^(Sens|Adapt|Expo)\\.|^Clim(Sens|Adapt|Expo|Vuln)(SD)?$'))
                AS FLOAT
            )
        FROM area_sources
        JOIN species USING (experiment, gi, gj)
        GROUP BY id, experiment, SpecID
        """
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    The same rows written twice, each sorted by the key the client filters on
    so row groups are pruned by their min/max stats: by area for the species in
    an area, by species for the areas a species is in. Row groups of 10240 rows
    (~10 areas) balance the bytes read per query against the footer size.
    """)
    return


@app.cell
def _(SPECIES_PER_AREA, area_species_stats, mo):
    _df = mo.sql(
        f"""
        COPY (
            FROM area_species_stats
            ORDER BY id, experiment, species_id
        ) TO '{SPECIES_PER_AREA}'
            (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 10240)
        """
    )
    return


@app.cell
def _(AREAS_PER_SPECIES, area_species_stats, mo):
    _df = mo.sql(
        f"""
        COPY (
            FROM area_species_stats
            ORDER BY species_id, id, experiment
        ) TO '{AREAS_PER_SPECIES}'
            (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 10240)
        """
    )
    return


@app.cell
def _(SPECIES_PER_AREA, mo):
    _df = mo.sql(
        f"""
        SELECT * FROM '{SPECIES_PER_AREA}' LIMIT 10
        """
    )
    return


if __name__ == "__main__":
    app.run()
