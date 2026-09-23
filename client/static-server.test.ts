// @vitest-environment node
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStaticServer } from "./static-server";

let base = "";
let server: ReturnType<typeof createStaticServer>;

beforeAll(async () => {
  const root = await mkdtemp(join(tmpdir(), "crib-static-"));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "_shell.html"), "<!doctype html><title>shell</title>");
  await writeFile(join(root, "favicon.ico"), "icon");
  await writeFile(join(root, "assets", "mpas-abc123.pmtiles"), Buffer.alloc(4096, 1));
  server = createStaticServer(root);
  await new Promise<void>((done) => server.listen(0, done));
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((done) => server.close(() => done())));

describe("static server", () => {
  it("serves the shell for the root and for extensionless routes", async () => {
    for (const path of ["/", "/12", "/12?scenario=high"]) {
      const res = await fetch(`${base}${path}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-cache");
      expect(await res.text()).toContain("<title>shell</title>");
    }
  });

  it("returns 404 for missing files instead of the shell", async () => {
    const res = await fetch(`${base}/assets/missing.js`);
    expect(res.status).toBe(404);
  });

  it("serves byte ranges of data assets with immutable caching", async () => {
    const res = await fetch(`${base}/assets/mpas-abc123.pmtiles`, {
      headers: { Range: "bytes=0-1023" },
    });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-1023/4096");
    expect((await res.arrayBuffer()).byteLength).toBe(1024);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("reports an unsatisfiable range as 416", async () => {
    const res = await fetch(`${base}/assets/mpas-abc123.pmtiles`, {
      headers: { Range: "bytes=999999-" },
    });
    expect(res.status).toBe(416);
  });

  it("leaves non-hashed files without a long cache", async () => {
    const res = await fetch(`${base}/favicon.ico`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=0");
  });
});
