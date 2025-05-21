# Stage 1: Build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cacheable layer)
COPY package*.json ./
RUN npm install

# Copy app source and build
COPY . .
RUN npm run build --no-cache

# Stage 2: Serve the built app with a smaller image
FROM node:22-alpine

WORKDIR /app

# Install lightweight HTTP server
RUN npm install -g serve

# Copy only the built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "dist", "-l", "3000"]
