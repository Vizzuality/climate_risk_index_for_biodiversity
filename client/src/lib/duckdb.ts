import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import {
  AREAS_PER_SPECIES_URL,
  SPECIES_PER_AREA_URL,
  SPECIES_PER_BIOREGION_URL,
  SPECIES_STATS_URL,
  STATS_URL,
} from "@/lib/data-urls";

export const STATS_FILE = "mpas_stats.parquet";
export const SPECIES_PER_AREA_FILE = "species_per_area.parquet";
export const AREAS_PER_SPECIES_FILE = "areas_per_species.parquet";
export const SPECIES_STATS_FILE = "species_stats.parquet";
export const SPECIES_PER_BIOREGION_FILE = "species_per_bioregion.parquet";

let connection: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function download(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetching ${url} failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function boot(): Promise<duckdb.AsyncDuckDBConnection> {
  const worker = new Worker(duckdbWorkerUrl);
  try {
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
    // The stats files are read whole, and DuckDB's range reads go one request
    // at a time, so they're downloaded in one request each while the wasm loads.
    const [stats, speciesStats] = await Promise.all([
      download(STATS_URL),
      download(SPECIES_STATS_URL),
      db.instantiate(duckdbWasmUrl),
    ]);
    // This build reads HTTP files whole unless told otherwise. CloudFront
    // answers DuckDB's ranged HEAD probe with a 200, so it needs the fallback
    // probe (a `Range: bytes=0-0` GET) that full HTTP reads enable.
    await db.open({ filesystem: { forceFullHTTPReads: false, allowFullHTTPReads: true } });
    const absolute = (url: string) => new URL(url, window.location.origin).href;
    await db.registerFileBuffer(STATS_FILE, stats);
    await db.registerFileBuffer(SPECIES_STATS_FILE, speciesStats);
    await db.registerFileURL(
      SPECIES_PER_AREA_FILE,
      SPECIES_PER_AREA_URL,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    await db.registerFileURL(
      AREAS_PER_SPECIES_FILE,
      AREAS_PER_SPECIES_URL,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    await db.registerFileURL(
      SPECIES_PER_BIOREGION_FILE,
      SPECIES_PER_BIOREGION_URL,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    const conn = await db.connect();
    // Point extension autoloading at the copy under public/ (layout:
    // <repo>/<duckdb version>/<platform>/<name>.duckdb_extension.wasm) so the
    // first parquet query doesn't depend on extensions.duckdb.org being up.
    const extensionRepo = absolute("/duckdb-extensions");
    await conn.query(`SET custom_extension_repository = '${extensionRepo}'`);
    await conn.query(`SET autoinstall_extension_repository = '${extensionRepo}'`);
    return conn;
  } catch (error) {
    worker.terminate();
    throw error;
  }
}

export function getDuckDBConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("duckdb-wasm is browser-only"));
  }
  connection ??= boot().catch((error) => {
    connection = null;
    throw error;
  });
  return connection;
}
