# Climate Risk Index for Biodiversity
Climate risk index for biodiversity — Technical prototype.

## Running the client with Docker Compose

The `client/` TanStack Start app can be built and run as a container via
[`docker-compose.yml`](./docker-compose.yml). The container is always named
`crib-client-prod`, so `docker compose up` reuses (recreates) that same container
on every rebuild instead of leaving orphaned, randomly-named containers behind.

### Mapbox token

Vite inlines `VITE_*` variables **at build time**, so the Mapbox
access token (the `crib2025` project token) must be available when the image
is built — the compose file passes it through as a build argument. Without it
the app still runs, but the map stays blank.

Provide it via a `.env` file next to `docker-compose.yml`:

```
VITE_MAPBOX_TOKEN=<your-mapbox-token>
```

or export it in your shell before building.

### Commands

```bash
docker compose up --build       # build the image and start crib-client
docker compose up --build -d    # same, detached
docker compose down             # stop and remove the container
```

The app is served on http://localhost:3000.

## Deploying the client to Railway

The client runs on [Railway](https://railway.com) as the `client` service of the
`CRIB` project (Vizzuality workspace, `production` environment), served at
https://crib-vizzuality.up.railway.app. Railway builds the same `client/Dockerfile`
that Docker Compose uses, so anything that builds locally with
`docker compose up --build` deploys unchanged.

The client is a static SPA: `pnpm build` prerenders one `_shell.html` plus hashed
assets into `client/dist/client`, and the container only runs a small static file
server (`client/static-server.ts`) that adds byte-range support, cache headers and
the shell fallback for deep links. The same folder can be uploaded to any static
host later (see ADR 0005).

The service is connected to this GitHub repository with `/client` as its root
directory, and deploys happen automatically in two ways:

- **Production** tracks `main`: every push to it builds and deploys
  https://crib-vizzuality.up.railway.app. The tracked branch is set in the
  service settings (`railway open`).
- **Pull requests** each get their own ephemeral environment, forked from
  `production` (so it inherits the Mapbox token and the other service
  variables), built from the PR branch and torn down when the PR closes. The
  environment and its preview URL appear in the Railway dashboard next to
  `production`.

A deploy can also be pushed from a working tree with the Railway CLI, which
uploads `client/` (honouring `client/.gitignore`) and builds it on Railway:

```bash
cd client
railway login              # once
railway link               # once — pick the CRIB project and the client service
railway up --ci
```

### Mapbox token

`VITE_MAPBOX_TOKEN` is inlined at build time (see above), so it has to exist as a
Railway **service variable** before the build runs — Railway passes service
variables into the Dockerfile as build arguments. Set it once (the value is read
from stdin so it never lands in your shell history), then redeploy:

```bash
cd client
printf '%s' "<your-mapbox-token>" | railway variable set VITE_MAPBOX_TOKEN --stdin
railway up --ci
```

Service settings that are not in the repo (region, healthcheck path `/`,
restart policy, public domain) live in the Railway dashboard: `railway open`.
