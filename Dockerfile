FROM node:24-alpine

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy package files and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .env ./
COPY server/package.json ./server/
COPY server/dist app/server/dist
COPY server/frontendDist app/server/frontendDist

RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
  NODE_AUTH_TOKEN=$(cat /run/secrets/NODE_AUTH_TOKEN) \
  pnpm install --frozen-lockfile --prod --ignore-scripts

# Use a non-root user to run the application
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 3005
WORKDIR /app/server

CMD ["node", "dist/server/src/server.js"]
