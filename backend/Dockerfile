# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma requires DATABASE_URL during generate; provide a build-time default that can be overridden.
ARG DATABASE_URL=postgresql://user:password@localhost:5432/doorbell
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run build
RUN npx prisma generate
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
EXPOSE 8080
CMD ["node", "dist/index.js"]
