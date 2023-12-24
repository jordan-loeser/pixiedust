# --------------------------------------------------------------------------
#  This Dockerfile is used to build /apps/renderer.
#
# TODO:
#   - Implement docker-compose and move this file in /apps/renderer.
# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
# NOTE: 
# I tried to optimize this Dockerfile using Turbo pruning but 
# I ran into an issue. Tracking here:
#
# https://github.com/Jordan-Loeser/pixiedust-express/issues/14
# --------------------------------------------------------------------------

FROM node:18.17.0 as base

# Add package file
COPY . .

# Install dependencies for node-canvas
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    libpango1.0-dev

# Install deps
RUN yarn install

# Build dist
RUN yarn build

CMD ["node", "apps/renderer/dist/index.js"]
