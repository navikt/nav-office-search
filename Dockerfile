FROM node:16-alpine

# Create app directory
WORKDIR /app

# Installing dependencies
COPY package*.json /app/
RUN npm ci

# Copying build folders
COPY .next /app/.next/

# Copy necessary files
COPY next.config.js /app/
COPY .env  /app/

# Start app
EXPOSE 3005
CMD ["npm", "run", "start"]
