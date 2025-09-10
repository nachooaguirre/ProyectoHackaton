FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["npm","run","start:prod"]


