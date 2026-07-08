# Climate Risk Index for Biodiversity
Climate risk index for biodiversity — Technical prototype.

## Running the client with Docker Compose

The `client/` Next.js app can be built and run as a container via
[`docker-compose.yml`](./docker-compose.yml). The container is always named
`crib-client-prod`, so `docker compose up` reuses (recreates) that same container
on every rebuild instead of leaving orphaned, randomly-named containers behind.

### Mapbox token

Next.js inlines `NEXT_PUBLIC_*` variables **at build time**, so the Mapbox
access token (the `crib2025` project token) must be available when the image
is built — the compose file passes it through as a build argument. Without it
the app still runs, but the map stays blank.

Provide it via a `.env` file next to `docker-compose.yml`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>
```

or export it in your shell before building.

### Commands

```bash
docker compose up --build       # build the image and start crib-client
docker compose up --build -d    # same, detached
docker compose down             # stop and remove the container
```

The app is served on http://localhost:3000.
