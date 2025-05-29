import marimo

__generated_with = "0.13.14"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    return


@app.cell
def _():
    import polars as pl
    import polars.selectors as cs
    import altair as alt
    import rasterio as rio
    return alt, cs, pl, rio


@app.cell
def _(pl):
    df = pl.scan_csv("../data/raw/Boyce_etal_2022_NATCC_Species_SpatRes.csv")
    return (df,)


@app.cell
def _(df, pl):
    sp_uniques = df.group_by('Lat', 'Lon').agg(pl.col('SPname').n_unique()).select("SPname").collect()
    return (sp_uniques,)


@app.cell
def _(alt, sp_uniques):
    alt.data_transformers.enable("vegafusion")
    alt.Chart(sp_uniques).mark_bar().encode(
        alt.X("SPname:Q").scale(type="log"),
        y='count()',
    )
    return


@app.cell
def _(df):
    df.head().collect()
    return


@app.cell
def _(cs, df, pl):
    aggregates = df.group_by('Lat', 'Lon', "Experiment").agg(cs.float().median())
    experiment_low = aggregates.filter(pl.col("Experiment") == 2.6)
    experiment_high = aggregates.filter(pl.col("Experiment") == 8.5)
    return (experiment_high,)


@app.cell
def _(experiment_high):
    l = experiment_high.select("Lat", "Lon", "Sens.TSMr").sort("Lat", descending=True).collect()
    return (l,)


@app.cell
def _(l):
    p = l.pivot(on="Lon", index="Lat", values="Sens.TSMr").drop("Lat")
    # Resort the columns by numeric value because pivot messes it up
    p = p.select([str(a) for a in sorted(float(e) for e in p.columns)])
    return (p,)


@app.cell
def _(l, p, pl, rio):
    data = p.to_numpy()
    transform = rio.transform.from_origin(
        north=l.select(pl.col("Lat").max()).item(),
        west=l.select(pl.col("Lon").min()).item(),
        xsize=1,
        ysize=1,
    )
    return data, transform


@app.cell
def _(transform):
    transform
    return


@app.cell
def _(data, rio, transform):
    with rio.open(
        "new.tif",
        "w",
        driver="GTiff",
        height=data.shape[0],
        width=data.shape[1],
        count=1,
        dtype=data.dtype,
        crs="+proj=latlong",
        transform=transform,
    ) as dst:
        dst.write(data, 1)
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
