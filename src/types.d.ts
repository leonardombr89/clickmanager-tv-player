interface Window {
  __CLICKTV_CONFIG__?: {
    apiBaseUrl?: string;
    syncIntervalSeconds?: number;
    heartbeatIntervalSeconds?: number;
    activationPollIntervalSeconds?: number;
  };
  __CLICKTV_LEGACY__?: boolean;
  __CLICKTV_LEGACY_COMPAT__?: {
    shouldUseLegacy(userAgent: string, moduleSupport: boolean): boolean;
  };
}
