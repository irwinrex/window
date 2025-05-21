# Stage 1: Build the app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# # Install Tailwind and PostCSS
# RUN npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind config (only if not already checked into repo)
# RUN npx tailwindcss init -p

# Copy app source and build
COPY . .

# Build the app (assuming Tailwind is used in build step)
RUN npm run build


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
