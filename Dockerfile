FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY server/ ./server/
COPY client/ ./client/

# Create persistent data dirs
RUN mkdir -p /data/uploads /data/vault

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/chronicle.db \
    VAULT_PATH=/data/vault

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "--experimental-sqlite", "server/src/index.js"]
