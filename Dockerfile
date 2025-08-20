# Multi-stage build for WebRTC Multi-Object Detection Server
FROM node:18-alpine AS base

# Install dependencies for certificate generation
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Generate SSL certificates if they don't exist
RUN if [ ! -f cert.pem ] || [ ! -f key.pem ]; then \
    echo "Generating SSL certificates..."; \
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/C=US/ST=CA/L=San Francisco/O=WebRTC Demo/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0.0.0.0"; \
    fi

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const https = require('https'); const fs = require('fs'); \
    const options = { hostname: 'localhost', port: 3443, path: '/', method: 'GET', \
    ca: fs.readFileSync('cert.pem'), rejectUnauthorized: false }; \
    const req = https.request(options, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); \
    req.on('error', () => process.exit(1)); req.end();"

# Start command
CMD ["node", "server.js"]
