# --------------------------------------------------------------------------
#  This Dockerfile is used to build /apps/renderer.
#
# TODO:
#   - Implement docker-compose and move this file in /apps/renderer.
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

# NOTE: using multiple stages is breaking canvas... simplified to one

CMD ["node", "apps/renderer/dist/index.js"]
