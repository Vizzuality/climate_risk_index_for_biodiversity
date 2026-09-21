import { fileURLToPath } from "node:url";
import { fromNodeMiddleware } from "h3";
import serveStatic from "serve-static";

// Nitro's built-in static handler buffers whole files and ignores Range
// headers, but the PMTiles archive and the COGs are read through byte-range
// requests. Nitro rewrites import.meta.url to the server entry, so
// ../public is .output/public — but only once the entry has run, so the
// handler must be created on the first request rather than at import time.
let handler: ReturnType<typeof serveStatic> | undefined;

export default fromNodeMiddleware((req, res, next) => {
  handler ??= serveStatic(fileURLToPath(new URL("../public/", import.meta.url)), {
    index: false,
    fallthrough: true,
  });
  return handler(req, res, next);
});
