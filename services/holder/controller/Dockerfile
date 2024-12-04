# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Copy the shared "common" directory
# COPY ../common ./common

# Expose the port the app runs on
EXPOSE 4001

# Start the application
CMD ["npm", "start"]
