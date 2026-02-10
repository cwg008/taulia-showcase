# Stage 1: Build client
FROM node:22.13-alpine AS client-builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

RUN npm install

COPY client/ ./client/

RUN npm run build --workspace=client

# Stage 2: Production server
FROM node:22.13-alpine

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install --production

COPY server/ ./server/

COPY --from=client-builder /app/server/public ./server/public

RUN mkdir -p ./server/uploads && \
    chown -R appuser:appgroup ./server/uploads && \
    chown appuser:appgroup ./server

# Switch to non-root user
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/auth/me || exit 1

CMD ["node", "server/index.js"]
