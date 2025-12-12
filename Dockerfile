FROM node:18-alpine AS base

# Install dependencies
FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build frontend
FROM base AS frontend-builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
WORKDIR /app/public/dashboard-app
RUN npm install --no-audit --no-fund
# Ignore ESLint errors during build
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy backend dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Copy application code
COPY --from=frontend-builder /app/public/dashboard-app/build ./public/dashboard-app/build
COPY src ./src
COPY public/css ./public/css
COPY public/*.html ./public/

# Create logs directory
RUN mkdir -p ./logs && chown -R appuser:nodejs ./logs

# Don't copy .env.example - use environment variables or mount .env
# REMOVED: COPY .env.example ./.env
RUN mkdir -p ./public/dashboard-app/build

# Change ownership to non-root user
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if(r.statusCode !== 200) throw new Error('Health check failed')})"

# Command to run the application
CMD ["node", "src/server.js"]