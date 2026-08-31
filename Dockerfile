# -------- BUILD --------
FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -------- PRODUCTION --------
FROM nginx:alpine

ARG BUILD_REVISION="local"
ARG BUILD_CREATED="unknown"
LABEL org.opencontainers.image.title="mobilesco-frontend" \
      org.opencontainers.image.revision="${BUILD_REVISION}" \
      org.opencontainers.image.created="${BUILD_CREATED}"

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN printf '{"app":"mobilesco-front","revision":"%s","created":"%s"}\n' "$BUILD_REVISION" "$BUILD_CREATED" > /usr/share/nginx/html/version.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
