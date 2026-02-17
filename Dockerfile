FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:24-slim

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy package files FIRST
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .env /app/
COPY server/package.json /app/server/

# Copy build artifacts
COPY server/dist /app/server/dist/
COPY server/frontendDist /app/frontendDist/

# NOW run pnpm install
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
  NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN) \
  pnpm install --frozen-lockfile --prod --ignore-scripts

# Use a non-root user to run the application
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3005
WORKDIR /app/server
CMD ["node", "server/dist/server/src/server.js"]
