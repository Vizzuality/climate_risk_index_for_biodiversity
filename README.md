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
https://crib-vizzuality.up.railway.app.
Railway builds the same `client/Dockerfile` that Docker Compose uses, so anything
that builds locally with `docker compose up --build` deploys unchanged.

Deploys are pushed from your machine with the Railway CLI; no GitHub integration
is configured:

```bash
cd client
railway login              # once
railway link               # once — pick the CRIB project and the client service
railway up --ci            # upload client/, build the image on Railway, deploy
```

`railway up` honours `client/.gitignore`, so local env files and build output are
never uploaded.

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
