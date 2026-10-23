# syntax=docker/dockerfile:1
# viavitae-web — multi-stage build: deps -> build -> standalone runtime.
# Produces a minimal, non-root runtime image from Next.js `output: standalone`.
# @via-vitae/brand is a local workspace package (packages/brand), so no registry
# auth or BuildKit npmrc secret is needed at build time.

ARG NODE_VERSION=22-alpine

# --- 1. deps: install the full dependency tree -------------------------------
FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app
# Install-only files first for layer caching.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- 2. build: generate contract types and build the app ---------------------
FROM node:${NODE_VERSION} AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time public env (defaults; overridden by the deploy pipeline).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEMO_URL
ARG NEXT_PUBLIC_MATOMO_URL
ARG NEXT_PUBLIC_MATOMO_SITE_ID
# Promote build args into the environment so `next build` inlines them. A Docker
# ARG alone is NOT visible to process.env inside RUN, so without this the values
# silently fall back to lib/config.ts defaults (localhost) in the deployed image.
# NEXT_PUBLIC_* are statically replaced in both the client and server bundles.
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEMO_URL=$NEXT_PUBLIC_DEMO_URL \
    NEXT_PUBLIC_MATOMO_URL=$NEXT_PUBLIC_MATOMO_URL \
    NEXT_PUBLIC_MATOMO_SITE_ID=$NEXT_PUBLIC_MATOMO_SITE_ID
ENV NEXT_TELEMETRY_DISABLED=1
# `prebuild` runs `generate:types` (openapi-typescript) before `next build`.
RUN pnpm build

# --- 3. runner: standalone production image ----------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user/group with fixed UID/GID (no login shell).
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next standalone output plus the static and public assets it serves.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
# Healthcheck hits the app root; adjust to a dedicated /healthz when added.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
