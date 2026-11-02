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
    # Species at risk status

    COSEWIC and SARA status of the CRIB species, one row per assessed
    population (COSEWIC designatable unit), from the Species at Risk public
    registry export. Species without a row haven't been assessed.

    SAR species are matched to CRIB species by genus and species, so
    subspecies rows attach to their species; `sar_scientific_name` keeps the
    full name. `Non-active` rows are dropped: they're designations superseded
    by a split into populations.
    """)
    return


@app.cell
def _(mo):
    DATAPATH = mo.notebook_dir().parent / "data"
    CRIB_DATASET = (
        DATAPATH / "01_raw" / "CRIB_VSEspecies_SSP126_585_2100_Canada_parquet/*.parquet"
    )
    SAR_SPECIES = DATAPATH / "01_raw" / "SAR Species - 1290 results.csv"
    SPECIES_SAR_STATUS = DATAPATH / "03_primary" / "species_sar_status.parquet"
    return CRIB_DATASET, SAR_SPECIES, SPECIES_SAR_STATUS


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    SAR names whose genus was revised since, mapped to the name in the CRIB
    data.
    """)
    return


@app.cell
def _(mo):
    _df = mo.sql(
        """
        CREATE OR REPLACE TABLE renames AS
        FROM (VALUES
            ('lagenorhynchus acutus', 'leucopleurus acutus'),
            ('lagenorhynchus obliquidens', 'sagmatias obliquidens'),
            ('raja rhina', 'beringraja rhina')
        ) AS t(sar_name, crib_name)
        """
    )
    return


@app.cell
def _(CRIB_DATASET, SAR_SPECIES, SPECIES_SAR_STATUS, mo):
    _df = mo.sql(
        f"""
        COPY (
            WITH sar AS (
                SELECT
                    *,
                    lower(
                        split_part("Scientific name", ' ', 1) || ' '
                        || split_part("Scientific name", ' ', 2)
                    ) AS binomial
                FROM read_csv('{SAR_SPECIES}', header = true, all_varchar = true)
                WHERE "COSEWIC status" IS DISTINCT FROM 'Non-active'
            ),
            crib AS (
                SELECT DISTINCT
                    CAST(SpecID AS INTEGER) AS species_id,
                    lower(SPname) AS binomial
                FROM read_parquet('{CRIB_DATASET}')
            )
            SELECT
                crib.species_id,
                sar."Scientific name" AS sar_scientific_name,
                sar."COSEWIC population" AS population,
                sar."COSEWIC status" AS cosewic_status,
                CAST(sar."COSEWIC last assessment date" AS DATE) AS cosewic_assessed,
                sar."Schedule 1 status" AS sara_status,
                sar."SARA schedule" AS sara_schedule
            FROM sar
            LEFT JOIN renames ON renames.sar_name = sar.binomial
            JOIN crib ON crib.binomial = coalesce(renames.crib_name, sar.binomial)
            ORDER BY species_id, population NULLS FIRST
        ) TO '{SPECIES_SAR_STATUS}' (FORMAT parquet, COMPRESSION zstd)
        """
    )
    return


@app.cell
def _(SPECIES_SAR_STATUS, mo):
    _df = mo.sql(
        f"""
        SELECT
            count(DISTINCT species_id) AS species,
            count(*) AS populations
        FROM '{SPECIES_SAR_STATUS}'
        """
    )
    return


@app.cell
def _(SPECIES_SAR_STATUS, mo):
    _df = mo.sql(
        f"""
        SELECT cosewic_status, sara_status, count(*) AS populations
        FROM '{SPECIES_SAR_STATUS}'
        GROUP BY ALL
        ORDER BY populations DESC
        """
    )
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
