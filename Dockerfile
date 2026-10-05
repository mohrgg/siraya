# 1. Base Image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js dengan mode standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 4. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Pasang Chromium, Font, dan OpenSSL untuk rendering PDF & Prisma runtime
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    openssl

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Buat user non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin output standalone, aset publik, dan prisma
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Pastikan static dan public juga ada di subfolder jika Next.js standalone membuat folder /app/siraya
RUN if [ -d "./siraya" ]; then \
      cp -r ./public ./siraya/ 2>/dev/null || true; \
      mkdir -p ./siraya/.next && cp -r ./.next/static ./siraya/.next/ 2>/dev/null || true; \
      cp -r ./prisma ./siraya/ 2>/dev/null || true; \
    fi

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "if [ -f server.js ]; then node server.js; elif [ -f siraya/server.js ]; then cd siraya && node server.js; else node $(find . -name server.js | head -n 1); fi"]
