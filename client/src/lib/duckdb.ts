import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import metadataUrl from "@/data/mpas_metadata.parquet?url";
import statsUrl from "@/data/mpas_stats.parquet?url";

export const STATS_FILE = "mpas_stats.parquet";
export const METADATA_FILE = "mpas_metadata.parquet";

let connection: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function boot(): Promise<duckdb.AsyncDuckDBConnection> {
  const worker = new Worker(duckdbWorkerUrl);
  try {
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
    await db.instantiate(duckdbWasmUrl);
    // registerFileURL only records the URL; duckdb range-reads it per query,
    // which is what makes a later swap to remote files a URL change.
    const absolute = (url: string) => new URL(url, window.location.origin).href;
    await db.registerFileURL(STATS_FILE, absolute(statsUrl), duckdb.DuckDBDataProtocol.HTTP, false);
    await db.registerFileURL(
      METADATA_FILE,
      absolute(metadataUrl),
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
