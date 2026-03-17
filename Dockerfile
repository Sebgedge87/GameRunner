# ── Stage 1: Build Vue client ─────────────────────────────────────────────────
FROM node:22-alpine AS client-build

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install server dependencies (prod only)
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix server

# Copy server source
COPY server/ ./server/

# Copy built client assets
COPY --from=client-build /build/client/dist ./client/dist

# Create persistent data dirs
RUN mkdir -p /data/uploads /data/vault

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/chronicle.db \
    VAULT_PATH=/data/vault

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["sh", "/app/start.sh"]
