FROM node:18.17.0 as base

# Add package file
COPY package.json ./
COPY yarn.lock ./

# Install dependencies for node-canvas
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    libpango1.0-dev

# Install deps
RUN yarn install

# Copy source
COPY src ./src
COPY @types ./@types
COPY tsconfig.json ./tsconfig.json

# Build dist
RUN yarn build

# # Start production image build
# FROM node:18.17.0

# # Copy node modules and build directory
# COPY --from=base ./node_modules ./node_modules # What if it's something with copying the node_modules??
# COPY --from=base /dist /dist

# Copy static files
COPY src/public dist/public

CMD ["dist/index.js"]