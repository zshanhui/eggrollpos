# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache curl vips

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist
COPY bin ./bin
COPY db ./db
COPY src/server ./src/server
COPY src/shared ./src/shared
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY scripts/create-merchant.js ./scripts/create-merchant.js
COPY scripts/seed-if-empty.js ./scripts/seed-if-empty.js
COPY scripts/reset-pg-sequences.js ./scripts/reset-pg-sequences.js
RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
