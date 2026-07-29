CRIB Data Processing
=======================

Install the dependencies with:

```
uv sync
```

## Run
Run the pipeline with

```
uv run kedro run --params mapbox_access_token=$(echo $MAPBOX_ACCESS_TOKEN)
```
`MAPBOX_ACCESS_TOKEN` must be the project's mapbox account token (project is called crib2025).
This token is used to upload to mapbox the vectorized grids via the Mapbox Tiling Service API. This step can be omitted by commenting
the nodes `publish_mapbox_tileset` from [pipeline.py](./src/data_processing/pipelines/processing/pipeline.py) if one prefers to upload the tilesets manually.

### Pipelines

This project has three kedro pipelines (`src/data_processing/pipelines/`):

- `processing`: the original MPAs/raster/mapbox pipeline (currently empty
  boilerplate — see tags below, historical).
- `zarr_cube`: builds the species x grid climate risk zarr cube (see below).
- `climate_risk_cogs`: builds COG rasters from that cube (see below). Its nodes
  take `zarr_cube`'s build summary as an input, so kedro's dependency graph
  enforces that the cube exists before these run — running `uv run kedro run`
  with no `--pipeline`/`--tags` filter runs everything in the correct order.

Run a single pipeline with `--pipeline`, e.g. `uv run kedro run --pipeline zarr_cube`.

### Tags
Kedro tags are used to select nodes within/across pipelines

- `raster`: Compute aggregated raster for each indicator across all species (processing, historical)
- `mpas`: Marine protected areas related nodes (processing, historical)
- `final`: Annotate marine protected areas with raster statistics (processing, historical)
- `zarr`: Build the species x grid-cell zarr cube (see below)
- `cog`: Build both climate risk COG products (see below)
- `general-risk-cog`: Just the general (all-species) climate risk COGs
- `species-risk-cog`: Just the per-species climate risk COGs

### Species x grid climate risk zarr cube

`build_species_grid_zarr_cube` (`src/data_processing/pipelines/zarr_cube/species_grid_zarr.py`)
turns the source species x grid-cell parquet table (~192M rows: one row per
species x 0.05deg grid cell x climate scenario) into a single zarr store with dims
`(experiment, species, lat, lon)`, so zonal stats and cross-dimension aggregation
(by scenario, species, or indicator) can be done directly with xarray/rioxarray
instead of re-reading parquet for every new aggregation:

```
uv run kedro run --pipeline zarr_cube
```

Settings (source glob, output path, chunk sizes) live under `species_grid_zarr` in
[`conf/base/parameters_processing.yml`](./conf/base/parameters_processing.yml) —
see the comments there for the current caveats around the source data location.

The cube has two stacked data variables rather than one per indicator, to keep the
chunk count manageable:

- `value` (float32): the continuous indicator columns, selected via an `indicator`
  coordinate (`Sens.TSMr`, `Adapt.hfrag`, `ClimVuln`, ...).
- `risk_category` (int8): the four categorical risk columns (`ClimSensRisk`,
  `ClimAdaptRisk`, `ClimExpoRisk`, `ClimRisk`), selected via a `risk_indicator`
  coordinate, encoded `0=no data, 1=Low, 2=Moderate, 3=High, 4=Critical`.

Since each species only occupies a small fraction of the full grid, the store is
written with `write_empty_chunks=False` and a chunk size of 1 along `species`: a
(species, region) combination with no data is simply never written to disk, so the
on-disk size tracks actual data density rather than the full
`species x lat x lon x experiment` volume. Species-level attributes that don't vary
by grid cell (`SPname`, `Comname`, `THabitat`, `PrpMiss`) are stored as small
auxiliary coordinates aligned to the `species` dimension instead of being gridded.

Open it with:

```python
import xarray as xr
ds = xr.open_zarr("data/02_intermediate/species_climate_risk_cube.zarr")
ds["value"].sel(experiment="585", indicator="ClimVuln")  # one (species, lat, lon) slice
```

### Climate risk COGs

`src/data_processing/pipelines/climate_risk_cogs/climate_risk_cog.py` reads the
zarr cube above and writes Cloud-Optimized GeoTIFFs of the `ClimRisk` category
(`0=no data, 1=Low, 2=Moderate, 3=High, 4=Critical`):

```
uv run kedro run --pipeline climate_risk_cogs
```

Two products, both one COG per experiment/scenario (`126`=SSP1-2.6/low,
`585`=SSP5-8.5/high):

- **General climate risk** (`--tags general-risk-cog`): 2 COGs total, at
  `data/03_primary/general_climate_risk_cogs/general_climate_risk_{experiment}.tif`.
  Each cell is the majority `ClimRisk` category across all species present there
  (ties broken toward the higher-risk class); cells with no species anywhere are
  nodata.
- **Per-species climate risk** (`--tags species-risk-cog`): ~10,660 COGs (5,330
  species x 2 experiments, species with no data in a scenario are skipped), at
  `data/03_primary/species_climate_risk_cogs/{experiment}/{spec_id}.tif`. No
  aggregation — each COG is just that species' own values, cropped to the
  bounding box it actually occupies (so file sizes vary a lot by range size).

Settings (zarr path, output dirs, and a `species_limit` for quick test runs) live
under `climate_risk_cog` in
[`conf/base/parameters_processing.yml`](./conf/base/parameters_processing.yml).

### Credentials
To access data in S3 we need to provided credentials by creating the file `./conf/local/credentials.yml` with this in it:

```yaml
s3_credentials:
  client_kwargs:
    aws_access_key_id: <KEY ID>
    aws_secret_access_key: <SECRET KEY>
```


### Data sources
Main data sources is located at vizz science S3 bucket. The user needs access to it to be able to run the first steps or obtain the data manually
through the original sources (check slack channel).

The biggest file is the grid: `Boyce_etal_2022_NATCC_Species_SpatRes`. It has been converted manually from the original CSV source (12Gb) to parquet file (2Gb) to optimize for space and reading time.


### Data outputs
This pipeline generates:

**Intermediate** results in `data/02_intermediate`:

- Raster TIF files with each indicator aggregation.
- The species x grid climate risk zarr cube (`species_climate_risk_cube.zarr`).

**Final** results in `data/03_primary`:

- mapbox tilesets for the two high and low experiments (aka scnearios) `grid_low` and `grid_high`.
- MPAs geojson to upload to mapbox `marine_protected_areas.geojson`.
- Annotated MPAs JSON with the indicator aggregations `marine_protected_areas_list_index.json`
