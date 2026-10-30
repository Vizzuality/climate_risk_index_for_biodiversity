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
    # Species within each bioregion
    """)
    return


@app.cell
def _(mo):
    import geopandas as gpd
    import numpy as np
    import pandas as pd
    from rasterio import features
    from rasterio.transform import from_origin

    DATAPATH = mo.notebook_dir().parent / "data"
    CRIB_DATASET = (
        DATAPATH / "01_raw" / "CRIB_VSEspecies_SSP126_585_2100_Canada_parquet/*.parquet"
    )
    BIOREGIONS = DATAPATH / "03_primary" / "marine_administrative_boundaries.gpkg"
    SPECIES_PER_BIOREGION = DATAPATH / "03_primary" / "species_per_bioregion.parquet"
    return (
        BIOREGIONS,
        CRIB_DATASET,
        SPECIES_PER_BIOREGION,
        features,
        from_origin,
        gpd,
        np,
        pd,
    )


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    Each bioregion is burned onto the CRIB 0.05° grid, keeping every cell it
    touches, so a cell on a boundary belongs to both bioregions. Grid indices come from the
    pixel centers (k * 0.05 + 0.025).
    """)
    return


@app.cell
def _(BIOREGIONS, features, from_origin, gpd, np, pd):
    res = 0.05
    bioregions = gpd.read_file(BIOREGIONS, columns=["region"]).to_crs("epsg:4326")
    minx, miny, maxx, maxy = bioregions.total_bounds
    gi0 = int(np.floor(minx / res))
    gj1 = int(np.ceil(maxy / res))
    shape = (gj1 - int(np.floor(miny / res)), int(np.ceil(maxx / res)) - gi0)
    transform = from_origin(gi0 * res, gj1 * res, res, res)

    cells = []
    for region, geom in zip(bioregions["region"], bioregions.geometry):
        rows, cols = np.nonzero(
            features.rasterize(
                [(geom, 1)],
                out_shape=shape,
                transform=transform,
                all_touched=True,
                dtype="uint8",
            )
        )
        cells.append(
            pd.DataFrame({"region": region, "gi": gi0 + cols, "gj": gj1 - 1 - rows})
        )
    bioregion_cells = pd.concat(cells, ignore_index=True)
    return (bioregion_cells,)


@app.cell
def _(CRIB_DATASET, bioregion_cells, mo):
    _df = mo.sql(
        f"""
        CREATE OR REPLACE TABLE species_bioregions AS
        WITH species AS (
            SELECT DISTINCT
                CAST(SpecID AS INTEGER) AS species_id,
                CAST(round(Lon / 0.05 - 0.5) AS INTEGER) AS gi,
                CAST(round(Lat / 0.05 - 0.5) AS INTEGER) AS gj
            FROM read_parquet('{CRIB_DATASET}')
            WHERE ClimVuln IS NOT NULL
        )
        SELECT region, species_id, count(*) AS n_cells
        FROM species
        JOIN bioregion_cells USING (gi, gj)
        GROUP BY region, species_id
        """
    )
    return


@app.cell
def _(SPECIES_PER_BIOREGION, mo, species_bioregions):
    _df = mo.sql(
        f"""
        COPY (
            FROM species_bioregions
            ORDER BY region, species_id
        ) TO '{SPECIES_PER_BIOREGION}'
            (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 2048)
        """
    )
    return


@app.cell
def _(SPECIES_PER_BIOREGION, mo):
    _df = mo.sql(
        f"""
        SELECT region, count(*) AS species, sum(n_cells) AS cells
        FROM '{SPECIES_PER_BIOREGION}'
        GROUP BY region
        ORDER BY region
        """
    )
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
