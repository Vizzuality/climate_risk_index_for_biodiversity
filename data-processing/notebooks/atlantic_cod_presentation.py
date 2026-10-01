import marimo

__generated_with = "0.24.1"
app = marimo.App(width="medium")


@app.cell
def _():
    import pathlib

    import geopandas as gpd
    import marimo as mo
    import matplotlib.patheffects as pe
    import matplotlib.pyplot as plt
    import numpy as np
    import polars as pl
    import rasterio
    from exactextract import exact_extract
    from matplotlib.colors import BoundaryNorm, ListedColormap
    from matplotlib.patches import Patch
    from rasterio.warp import (
        Resampling,
        calculate_default_transform,
        reproject,
        transform_bounds,
    )

    DATAPATH = pathlib.Path.cwd() / "data"
    OUT = DATAPATH / "08_reporting" / "atlantic_cod"
    OUT.mkdir(parents=True, exist_ok=True)

    SPEC_ID = 126436
    AREA_NAME = "Western and Emerald Banks Marine Refuge"
    BBOX = (-72, 40, -47, 62)  # cod core range, lon/lat

    # Same palette as the webapp (client/src/lib/risk-colormap.ts)
    RISK_LABELS = ["Negligible", "Moderate", "High", "Critical"]
    RISK_COLORS = ["#45B9C7", "#B5E2D1", "#F1BC83", "#D95730"]
    # Dark text with a white halo: readable on light and dark slides
    HALO = [pe.withStroke(linewidth=3, foreground="white")]
    return (
        AREA_NAME,
        BBOX,
        BoundaryNorm,
        DATAPATH,
        HALO,
        ListedColormap,
        OUT,
        Patch,
        RISK_COLORS,
        RISK_LABELS,
        Resampling,
        SPEC_ID,
        calculate_default_transform,
        exact_extract,
        gpd,
        mo,
        np,
        pl,
        plt,
        rasterio,
        reproject,
        transform_bounds,
    )


@app.cell
def _(mo):
    mo.md("""
    # Atlantic cod (*Gadus morhua*) — climate risk

    Figures and tables for the presentation. Risk classes use the per-indicator
    breaks in `thresholds_standardized.csv`. Outputs go to `data/08_reporting/atlantic_cod/`.
    """)
    return


@app.cell
def _():
    # Raster band -> `ind` in thresholds_standardized.csv
    THRESHOLD_KEY = {
        "Sens.TSMr": "S.TSMr",
        "Sens.RLstatus": "S.rlstatus",
        "Sens.HII": "S.HII",
        "Sens.vind": "S.vind",
        "Adapt.hfrag": "AC.hfrag",
        "Adapt.lmax": "AC.lmax",
        "Adapt.hrange": "AC.hrange",
        "Adapt.tvar": "AC.tvar",
        "Expo.toe": "E.toe",
        "Expo.vel": "E.vel",
        "Expo.plost": "E.plost",
        "Expo.nrchng": "E.nrchng",
        "ClimSens": "Sensitivity",
        "ClimAdapt": "Adaptive capacity",
        "ClimExpo": "Exposure",
        "ClimVuln": "Vulnerability",
    }
    INDICATORS = [b for b in THRESHOLD_KEY if not b.startswith("Clim")]
    return INDICATORS, THRESHOLD_KEY


@app.cell
def _(DATAPATH, THRESHOLD_KEY, pl):
    _to_band = {v: k for k, v in THRESHOLD_KEY.items()}
    thresholds = (
        pl.read_csv(DATAPATH / "01_raw" / "thresholds_standardized.csv")
        .filter(pl.col("ind").is_in(list(_to_band)))
        .select(
            band=pl.col("ind").replace_strict(_to_band),
            breaks=pl.concat_list("tlow", "tmed", "thigh"),
        )
    )
    BREAKS = dict(thresholds.iter_rows())
    return (BREAKS,)


@app.cell
def _(BREAKS, RISK_LABELS, np):
    def risk_class(band, value):
        return RISK_LABELS[int(np.searchsorted(BREAKS[band], value, side="right"))]

    return (risk_class,)


@app.cell
def _(THRESHOLD_KEY, mo):
    scenario = mo.ui.dropdown(
        {"SSP1-2.6": 126, "SSP5-8.5": 585}, value="SSP5-8.5", label="Scenario"
    )
    map_band = mo.ui.dropdown(
        list(THRESHOLD_KEY), value="ClimSens", label="Variable to map"
    )
    mo.hstack([scenario, map_band], justify="start")
    return map_band, scenario


@app.cell
def _(AREA_NAME, DATAPATH, gpd):
    area = gpd.read_file(
        DATAPATH / "01_raw" / "marine_conservation_areas_with_regions.gpkg",
        where=f"name = '{AREA_NAME}'",
    ).to_crs(4326)
    area
    return (area,)


@app.cell
def _(DATAPATH, SPEC_ID):
    def species_raster(ssp):
        return DATAPATH / "02_intermediate" / "species_fixed" / f"{SPEC_ID}_{ssp}.tif"

    return (species_raster,)


@app.cell
def _(
    BBOX,
    BREAKS,
    BoundaryNorm,
    HALO,
    ListedColormap,
    OUT,
    Patch,
    RISK_COLORS,
    RISK_LABELS,
    Resampling,
    calculate_default_transform,
    map_band,
    np,
    plt,
    rasterio,
    reproject,
    scenario,
    species_raster,
    transform_bounds,
):
    def risk_map(band, ssp):
        # Warp to Web Mercator (EPSG:3857) so the figure matches the webapp map
        with rasterio.open(species_raster(ssp)) as src:
            transform, width, height = calculate_default_transform(
                src.crs, 3857, src.width, src.height, *src.bounds
            )
            data = np.full((height, width), np.nan, dtype="float32")
            reproject(
                rasterio.band(src, src.descriptions.index(band) + 1),
                data,
                dst_transform=transform,
                dst_crs=3857,
                dst_nodata=np.nan,
                resampling=Resampling.nearest,
            )
        left, top = transform * (0, 0)
        right, bottom = transform * (width, height)
        xmin, ymin, xmax, ymax = transform_bounds(4326, 3857, *BBOX)

        fig, ax = plt.subplots(figsize=(7, 7))
        ax.imshow(
            np.ma.masked_invalid(data),
            extent=(left, right, bottom, top),
            cmap=ListedColormap(RISK_COLORS),
            norm=BoundaryNorm([0, *BREAKS[band], 1], 4),
            interpolation="nearest",
        )
        # area.to_crs(3857).boundary.plot(ax=ax, color="#1F2937", linewidth=1.2)
        ax.set_xlim(xmin, xmax)
        ax.set_ylim(ymin, ymax)
        ax.set_aspect("equal")
        ax.set_axis_off()

        ax.set_title(
            f"{band} · SSP{ssp}",
            loc="left",
            fontsize=12,
            color="#1F2937",
            path_effects=HALO,
        )
        leg = ax.legend(
            handles=[
                Patch(color=c, label=lab) for c, lab in zip(RISK_COLORS, RISK_LABELS)
            ],
            title="Risk",
            loc="lower right",
            fontsize=8,
            title_fontsize=8,
            frameon=False,
        )
        for t in [*leg.get_texts(), leg.get_title()]:
            t.set_path_effects(HALO)
        fig.tight_layout()
        fig.savefig(OUT / f"map_{band}_{ssp}.png", dpi=200, transparent=True)
        return fig

    risk_map(map_band.value, scenario.value)
    return


@app.cell
def _(
    AREA_NAME,
    OUT,
    THRESHOLD_KEY,
    area,
    exact_extract,
    pl,
    rasterio,
    risk_class,
    species_raster,
):
    _frames = []
    for _ssp in (126, 585):
        with rasterio.open(species_raster(_ssp)) as _src:
            _bands = _src.descriptions
            _df = pl.from_pandas(
                exact_extract(
                    _src, area, ["mean", "min", "max", "stdev"], output="pandas"
                )
            )
        _frames.append(
            _df.unpivot()
            .with_columns(
                pl.col("variable")
                .str.extract(r"band_(\d+)_(\w+)", 1)
                .cast(int)
                .alias("i"),
                pl.col("variable").str.extract(r"band_(\d+)_(\w+)", 2).alias("stat"),
            )
            .pivot("stat", index="i", values="value")
            .with_columns(
                scenario=pl.lit(_ssp),
                band=pl.col("i").map_elements(
                    lambda i: _bands[i - 1], return_dtype=pl.String
                ),
            )
        )

    zonal = (
        pl.concat(_frames)
        .filter(pl.col("band").is_in(list(THRESHOLD_KEY)))
        .with_columns(
            area=pl.lit(AREA_NAME),
            risk=pl.struct("band", "mean").map_elements(
                lambda r: risk_class(r["band"], r["mean"]), return_dtype=pl.String
            ),
        )
        .select("area", "scenario", "band", "mean", "min", "max", "stdev", "risk")
        .with_columns(pl.col("mean", "min", "max", "stdev").round(4))
        .sort("scenario", "band")
    )
    zonal.write_csv(OUT / "zonal_stats_western_emerald_banks.csv")
    zonal
    return (zonal,)


@app.cell
def _(
    AREA_NAME,
    HALO,
    INDICATORS,
    OUT,
    RISK_COLORS,
    RISK_LABELS,
    np,
    pl,
    plt,
    risk_class,
    scenario,
    zonal,
):
    def radar(ssp):
        """Port of client/src/containers/detail/climate-risk-chart/chart.tsx"""
        z = zonal.filter(pl.col("scenario") == ssp)
        mean = dict(z.select("band", "mean").iter_rows())
        bands = INDICATORS
        n = len(bands)
        values = [mean[b] for b in bands]
        colors = [RISK_COLORS[RISK_LABELS.index(risk_class(b, mean[b]))] for b in bands]

        fig = plt.figure(figsize=(7, 7))
        ax = fig.add_axes([0.14, 0.14, 0.72, 0.72], projection="polar")
        ax.set_theta_zero_location("N")
        ax.set_theta_direction(-1)
        theta = np.arange(n) * 2 * np.pi / n
        ax.bar(
            theta,
            values,
            width=2 * np.pi / n,
            align="edge",
            color=colors,
            alpha=0.8,
            edgecolor="white",
            linewidth=2,
        )

        ax.set_facecolor("none")
        ax.set_ylim(0, 1)
        ax.set_axisbelow(True)
        ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0], labels=[])
        ax.set_xticks(theta, labels=[])
        ax.grid(color="#E5E7EB", linewidth=1)
        ax.spines["polar"].set_visible(False)
        for t, b in zip(theta + np.pi / n, bands):
            ax.text(
                t,
                1.12,
                b,
                ha="center",
                va="center",
                fontsize=10,
                color="#1F2937",
                path_effects=HALO,
            )

        for band, (x, y) in zip(
            ["ClimSens", "ClimAdapt", "ClimExpo"],
            [(0.12, 0.93), (0.88, 0.93), (0.88, 0.08)],
        ):
            fig.text(
                x,
                y,
                band,
                ha="center",
                fontsize=12,
                fontweight="bold",
                color="#1F2937",
                path_effects=HALO,
            )
            fig.text(
                x,
                y - 0.035,
                f"{mean[band]:.3f}",
                ha="center",
                fontsize=11,
                color="#1F2937",
                path_effects=HALO,
            )

        leg = fig.legend(
            handles=[plt.Rectangle((0, 0), 1, 1, color=c) for c in RISK_COLORS],
            labels=RISK_LABELS,
            loc="lower left",
            ncols=4,
            frameon=False,
            fontsize=8,
            title="Risk",
            title_fontsize=8,
            bbox_to_anchor=(0.02, 0.01),
        )
        for t in [*leg.get_texts(), leg.get_title()]:
            t.set_path_effects(HALO)
        fig.suptitle(
            f"Atlantic cod · {AREA_NAME} · SSP{ssp}",
            x=0.5,
            y=0.995,
            fontsize=11,
            color="#1F2937",
            path_effects=HALO,
        )
        for ext in ("png", "svg"):
            fig.savefig(
                OUT / f"radar_western_emerald_banks_{ssp}.{ext}",
                dpi=200,
                transparent=True,
            )
        return fig

    radar(scenario.value)
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
