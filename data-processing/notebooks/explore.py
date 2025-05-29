# ruff: noqa: E501

import marimo

__generated_with = "0.13.14"
app = marimo.App(width="medium")


@app.cell
def _():
    return


@app.cell
def _():
    import altair as alt
    import polars as pl

    return alt, pl


@app.cell
def _(pl):
    df = pl.scan_csv("../data/raw/Boyce_etal_2022_NATCC_Species_SpatRes.csv")
    return (df,)


@app.cell
def _(df, pl):
    sp_uniques = (
        df.group_by("Lat", "Lon").agg(pl.col("SPname").n_unique()).select("SPname").collect()
    )
    return (sp_uniques,)


@app.cell
def _(alt, sp_uniques):
    alt.data_transformers.enable("vegafusion")
    alt.Chart(sp_uniques).mark_bar().encode(
        alt.X("SPname:Q").scale(type="log"),
        y="count()",
    )
    return


if __name__ == "__main__":
    app.run()
