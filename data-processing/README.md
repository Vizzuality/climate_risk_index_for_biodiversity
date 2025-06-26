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
the nodes `publish_mapbox_tileset` from the [pipeline.py](./src/data_processing/pipelines/processing/pipeline.py)

### Tags
Kedro tags are used to separate the parts of the pipeline

- `raster`: Compute aggregated raster for each indicator across all species
- `mpas`: Marine protected areas related nodes
- `final`: Annotate marine protected areas with raster statistics (yes I know the name is not good)



## Data sources
Main data sources is located at vizz science S3 bucket. The user needs access to it to be able to run the first steps or obtain the data manually
through the original sources (check slack channel).

The biggest file is the grid: `Boyce_etal_2022_NATCC_Species_SpatRes`. It has been converted manually from the original CSV source (12Gb) to parquet file (2Gb) to optimize for space and reading time.
