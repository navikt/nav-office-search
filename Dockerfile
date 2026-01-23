FROM node:24-alpine

WORKDIR /app

COPY package*.json /app/
COPY server .env /app/server/
COPY node_modules /app/node_modules/

EXPOSE 3005
CMD ["npm", "run", "start"]
