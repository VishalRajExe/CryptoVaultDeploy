# Step 1: Build the Vite project
FROM node:18-alpine AS build

# Set build argument for Vite base API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files and build
COPY . .
RUN npm build || npm run build

# Step 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration to handle SPA routing (crucial for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
