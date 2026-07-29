window.__CLICKTV_CONFIG__ = {
  apiBaseUrl: '${CLICKTV_API_BASE_URL}',
  syncIntervalSeconds: Number('${CLICKTV_SYNC_INTERVAL_SECONDS}' || 60),
  heartbeatIntervalSeconds: Number('${CLICKTV_HEARTBEAT_INTERVAL_SECONDS}' || 30),
  activationPollIntervalSeconds: Number(
    '${CLICKTV_ACTIVATION_POLL_INTERVAL_SECONDS}' || 3
  )
};
