# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.7.0
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

FROM base as deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --legacy-peer-deps

FROM deps as build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps
COPY . .
ENV NODE_ENV production
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build && rm -rf node_modules

FROM base as final
ENV NODE_ENV production
RUN mkdir -p /home/node/.npm && chown -R node:node /home/node/.npm
USER node
COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/. ./.
EXPOSE 3000
CMD npm start