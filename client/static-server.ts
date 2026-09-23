import { STATUS_CODES, createServer } from "node:http";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import serveStatic from "serve-static";

const SHELL = "/_shell.html";
const IMMUTABLE_DIRS = ["assets", "duckdb-extensions"];

// Serves the SPA build the way a CDN in front of a bucket would: files as
// they are (with Range support, which the PMTiles archive and the COGs
// need), the shell for any extensionless path, and a real 404 otherwise.
export function createStaticServer(rootDir: string) {
  const files = serveStatic(rootDir, {
    index: false,
    redirect: false,
    fallthrough: false,
    setHeaders(res, filePath) {
      const topDir = relative(rootDir, filePath).split(sep)[0];
      if (IMMUTABLE_DIRS.includes(topDir)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(SHELL)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  });

  return createServer((req, res) => {
    const isPageRequest = req.method === "GET" || req.method === "HEAD";
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    if (isPageRequest && extname(pathname) === "") {
      req.url = SHELL;
    }
    files(req, res, (error?: { statusCode?: number }) => {
      res.statusCode = error?.statusCode ?? 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(STATUS_CODES[res.statusCode] ?? "Error");
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "client");
  const port = Number(process.env.PORT) || 3000;
  createStaticServer(rootDir).listen(port, () => {
    console.log(`Serving ${rootDir} on http://localhost:${port}`);
  });
}
