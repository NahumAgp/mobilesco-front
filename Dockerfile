# -------- BUILD --------
FROM node:20-alpine AS builder

# ✅ 1. Agrega esta línea (recibe el argumento)
ARG VITE_API_BASE_URL

# ✅ 2. Agrega esta línea (lo pasa a Vite)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build   # ← Ahora Vite usará la variable

# -------- PRODUCTION --------
FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]