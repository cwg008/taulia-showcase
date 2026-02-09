# Stage 1: Build client
FROM node:22.13-alpine AS client-builder

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install client dependencies
RUN npm install --workspace=client

# Copy entire client directory
COPY client/ ./client/

# Build client with Vite
RUN rm -rf server/public && npm run build --workspace=client

# Stage 2: Production server
FROM node:22.13-alpine

# Add non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install server dependencies (production only)
RUN npm install --workspace=server --omit=dev && \
    npm cache clean --force

# Copy server code
COPY server ./server

# Copy built client from builder stage
COPY --from=client-builder /app/server/public ./server/public

# Create necessary directories with proper ownership
RUN mkdir -p /app/server/uploads/prototypes \
    /app/server/uploads/thumbnails \
    /app/server/uploads/temp && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]
