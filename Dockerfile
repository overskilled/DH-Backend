# Stage 1: build
FROM node:20.11.1-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies and OpenSSL
RUN apk add --no-cache python3 make g++ openssl

# Copy only dependency files first for caching
COPY package*.json ./

# Copy prisma schema before install (important for postinstall hook)
COPY prisma ./prisma

# Set environment variables for Prisma
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x

# Install dependencies with increased timeout and retries
# Skip postinstall scripts first, then generate Prisma client separately
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5 && \
    npm install --ignore-scripts --no-audit

# Generate Prisma Client with retry logic
RUN npx prisma generate || \
    (sleep 5 && npx prisma generate) || \
    (sleep 10 && npx prisma generate)

# Copy the rest of your source code
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: production image
FROM node:20.11.1-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy build output and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]