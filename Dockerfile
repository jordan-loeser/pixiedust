# --------------------------------------------------------------------------
#  This Dockerfile is used to build /apps/renderer.
#
# TODO:
#   - Implement docker-compose and move this file in /apps/renderer.
# --------------------------------------------------------------------------

FROM node:18.17.0 as base

FROM base AS builder
# # Install dependencies for node-canvas
# RUN apt-get update && apt-get install -y \
#     libcairo2-dev \
#     libjpeg-dev \
#     libgif-dev \
#     libpango1.0-dev
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune renderer --docker

# --------------------------------------------------------------------------

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
# Install dependencies for node-canvas
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    libpango1.0-dev
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN yarn turbo build --filter=renderer...
RUN cd apps/renderer && ls -la && cd ../..

# --------------------------------------------------------------------------

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 777 expressjs
RUN adduser --system --uid 777 expressjs
USER expressjs
COPY --from=installer /app .

RUN cd apps/renderer && ls -la && cd ../..

CMD ["node", "apps/renderer/dist/index.js"]
