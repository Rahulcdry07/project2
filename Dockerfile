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

# Copy backend dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Copy application code
COPY --from=frontend-builder /app/public/dashboard-app/build ./public/dashboard-app/build
COPY src ./src
COPY public/css ./public/css
COPY public/*.html ./public/

# Copy configuration files
COPY .env.example ./.env
RUN mkdir -p ./public/dashboard-app/build

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["node", "src/server.js"]