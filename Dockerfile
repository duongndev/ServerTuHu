# Multi-stage Dockerfile for Node.js 22 (Alpine)
FROM node:22-alpine AS builder

# Install build tools for native modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Copy application source
COPY . .

# --- Runtime stage ---
FROM node:22-alpine AS runner
WORKDIR /usr/src/app

# Minimal runtime deps
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5000

# Copy only necessary artifacts
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/server.js ./server.js
COPY --from=builder /usr/src/app/src ./src

# Run as non-root user provided by Node image
USER node

EXPOSE 5000

# Healthcheck against health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:5000/health || exit 1

CMD ["node", "server.js"]