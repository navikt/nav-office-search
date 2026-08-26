FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .env /app/
COPY packages/server/package.json /app/packages/server/

# Copy node_modules from CI build
COPY node_modules /app/node_modules/
COPY packages/server/node_modules /app/packages/server/node_modules/

# Copy build artifacts
COPY packages/server/dist /app/packages/server/dist/
COPY packages/server/frontendDist /app/frontendDist/

ENV NODE_ENV=production

EXPOSE 3005
ENTRYPOINT [ "node" ]
CMD ["packages/server/dist/server/src/server.js"]
