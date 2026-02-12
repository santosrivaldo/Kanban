FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY api public docs server.js ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
