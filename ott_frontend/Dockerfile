# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --no-audit --prefer-offline

# Copy the rest of the source
COPY . ./

# Build the app for production
RUN npm run build

# Stage 2: Serve the build with a lightweight web server
FROM nginx:1.25-alpine

# Copy built static files into Nginx public directory
COPY --from=build /app/build /usr/share/nginx/html

# Remove the default Nginx config and add our own, for SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
