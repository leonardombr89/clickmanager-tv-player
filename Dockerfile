FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-clicktv-env.sh /docker-entrypoint.d/40-clicktv-env.sh
COPY src/assets/env.template.js /opt/clicktv/env.template.js
COPY --from=build /app/dist/clickmanager-tv-player/browser /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-clicktv-env.sh

ENV CLICKTV_API_BASE_URL="" \
    CLICKTV_SYNC_INTERVAL_SECONDS="60" \
    CLICKTV_HEARTBEAT_INTERVAL_SECONDS="30" \
    CLICKTV_ACTIVATION_POLL_INTERVAL_SECONDS="3"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
