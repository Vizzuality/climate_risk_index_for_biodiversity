FROM node:24.18.0-alpine3.24 AS base

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN npm install --global "pnpm@$(node -p "require('./package.json').devEngines.packageManager.version")" \
  && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/pnpm
COPY --from=deps /usr/local/bin/pnpm /usr/local/bin/pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 tanstack

COPY --from=builder --chown=tanstack:nodejs /app/dist/client ./dist/client
COPY --from=builder --chown=tanstack:nodejs /app/dist/server.mjs ./dist/server.mjs

USER tanstack

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/server.mjs"]
