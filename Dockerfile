FROM node:16-bullseye-slim

WORKDIR /app

# Install native compilation dependencies for sqlite3 / bcrypt
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3333/ || exit 1

CMD ["node", "server.js"]
