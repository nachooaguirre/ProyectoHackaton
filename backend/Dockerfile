FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
# Usa el binario local de NestJS para evitar problemas de permisos en Alpine/Render
RUN node node_modules/@nestjs/cli/bin/nest.js build
# Render setea $PORT, Nest usará process.env.PORT
EXPOSE 5100
CMD ["sh","-c","node dist/main.js"]


