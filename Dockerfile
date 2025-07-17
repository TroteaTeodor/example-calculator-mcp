FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --only=production

# Copy source code
COPY . .

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Start the HTTP server
CMD ["npm", "run", "start:http"] 