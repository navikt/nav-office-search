FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .env /app/
COPY server/package.json /app/server/

# Copy node_modules from CI build
COPY node_modules /app/node_modules/
COPY server/node_modules /app/server/node_modules/

# Copy build artifacts
COPY server/dist /app/server/dist/
COPY server/frontendDist /app/frontendDist/

ENV NODE_ENV=production

EXPOSE 3005
ENTRYPOINT [ "node" ]
CMD ["server/dist/server/src/server.js"]
