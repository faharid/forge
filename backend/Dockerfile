# syntax=docker/dockerfile:1

# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

# ─── Dependencies ───────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
  && npm install \
  && apk del python3 make g++

# ─── Development (hot reload) ───────────────────────────────────────────────
FROM deps AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ─── Build ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ─── Production ─────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
  && npm install --omit=dev \
  && apk del python3 make g++

COPY --from=builder /app/dist ./dist
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["./scripts/start.sh"]
