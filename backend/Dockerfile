FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
ENV PORT=5100
EXPOSE 5100
CMD ["npm","run","start:prod"]


