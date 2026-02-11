FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim

WORKDIR /app

COPY package*.json /app/
COPY server .env /app/server/
COPY node_modules /app/node_modules/
COPY server/dist /app/server/dist/
COPY server/node_modules* /app/server/node_modules/

EXPOSE 3005
ENTRYPOINT ["node"]
CMD ["server/dist/server/src/server.js"]