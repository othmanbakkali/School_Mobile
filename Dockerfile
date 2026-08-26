# Stage 1: Build Frontend Vue/Ionic App
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server/index.js"]
