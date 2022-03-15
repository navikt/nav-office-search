FROM node:16-alpine

# Create app directory
WORKDIR /app

# Installing dependencies
COPY package*.json /app/
COPY node_modules /app/node_modules/

# Copying build folders
COPY .next /app/.next/

# Copy necessary files
COPY next.config.js /app/
COPY .env  /app/

# Copy raw data
COPY rawdata /app/rawdata/

# Start app
EXPOSE 3005
CMD ["npm", "run", "start"]
