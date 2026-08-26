FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY dist ./dist

EXPOSE 3000

CMD ["node", "server/index.js"]
