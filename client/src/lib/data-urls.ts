const DATA_BASE_URL = "https://d2g59ujvhm7q3s.cloudfront.net/data";

// The CDN answers CORS preflight with 403, so every read must be a simple
// request: GET or HEAD with at most a single `Range: bytes=a-b` header.
export const STATS_URL = `${DATA_BASE_URL}/mpas_stats.parquet`;
export const AREAS_PMTILES_URL = `${DATA_BASE_URL}/mpas.pmtiles`;
export const LOW_EMISSIONS_RASTER_URL = `${DATA_BASE_URL}/126_climvuln_cog.tif`;
export const HIGH_EMISSIONS_RASTER_URL = `${DATA_BASE_URL}/585_climvuln_cog.tif`;
