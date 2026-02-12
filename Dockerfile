FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY api ./api
COPY public ./public
COPY docs ./docs
COPY server.js ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
