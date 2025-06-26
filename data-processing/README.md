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

### Tags
Kedro tags are used to separate the parts of the pipeline

- `raster`: Compute aggregated raster for each indicator across all species
- `mpas`: Marine protected areas related nodes
- `final`: Annotate marine protected areas with raster statistics (yes I know the name is not good)


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

**Final** results in `data/03_primary`:

- mapbox tilesets for the two high and low experiments (aka scnearios) `grid_low` and `grid_high`.
- MPAs geojson to upload to mapbox `marine_protected_areas.geojson`.
- Annotated MPAs JSON with the indicator aggregations `marine_protected_areas_list_index.json`
