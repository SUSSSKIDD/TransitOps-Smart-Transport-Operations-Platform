# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source and prisma schema
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY scripts/ ./scripts/

# Generate Prisma Client and Build TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Set node environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built app and prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Run migrations at startup, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

EXPOSE 4000
