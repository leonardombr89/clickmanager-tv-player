#!/bin/sh
set -eu

envsubst \
  '${CLICKTV_API_BASE_URL} ${CLICKTV_SYNC_INTERVAL_SECONDS} ${CLICKTV_HEARTBEAT_INTERVAL_SECONDS} ${CLICKTV_ACTIVATION_POLL_INTERVAL_SECONDS}' \
  < /opt/clicktv/env.template.js \
  > /usr/share/nginx/html/assets/env.js
