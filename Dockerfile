# syntax=docker/dockerfile:1.7
FROM node:24-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml* .npmrc ./
RUN --mount=type=secret,id=NODE_AUTH_TOKEN \
    if [ -f /run/secrets/NODE_AUTH_TOKEN ]; then echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NODE_AUTH_TOKEN)" >> .npmrc; fi && \
    pnpm install --frozen-lockfile || pnpm install && \
    sed -i '/_authToken/d' .npmrc
COPY . .
ARG DOCS_BASE=/
ENV DOCS_BASE=$DOCS_BASE
RUN pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null || exit 1
