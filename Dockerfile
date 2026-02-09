# Stage 1: Build client
FROM node:22-alpine AS client-builder

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/

RUN npm install

COPY client/ ./client/

RUN npm run build --workspace=client

# Stage 2: Production server
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install --production

COPY server/ ./server/

COPY --from=client-builder /app/server/public ./server/public

RUN mkdir -p ./server/uploads

EXPOSE 3001

CMD ["node", "server/index.js"]
