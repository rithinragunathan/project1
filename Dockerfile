FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy root configurations (if any)
COPY package*.json ./

# Copy package structures for caching
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
RUN npm install --prefix server --production=false

# Install client dependencies
RUN npm install --prefix client

# Copy application code
COPY . .

# Build Vite client app
RUN npm run build --prefix client

# Set correct environments
ENV NODE_ENV=production

# Render configures port dynamically, but we expose 5000 as a hint
EXPOSE 5000

# Start the application
CMD ["npm", "start", "--prefix", "server"]
