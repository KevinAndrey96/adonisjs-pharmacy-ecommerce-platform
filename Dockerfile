# Production Dockerfile for Pharmacy E-Commerce Platform
FROM node:18-alpine

# Install build dependencies for native modules (sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++ git

WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install application dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy application source code
COPY --chown=node:node . .

USER node

# Expose application port
EXPOSE 3333

# Environment defaults
ENV HOST=0.0.0.0
ENV PORT=3333
ENV NODE_ENV=production
ENV ENV_SILENT=true

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3333/ || exit 1

# Start server
CMD ["node", "server.js"]
