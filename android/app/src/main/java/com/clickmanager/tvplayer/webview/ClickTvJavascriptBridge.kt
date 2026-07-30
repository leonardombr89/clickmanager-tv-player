package com.clickmanager.tvplayer.webview

import android.util.Log
import android.webkit.JavascriptInterface
import com.clickmanager.tvplayer.BuildConfig
import com.clickmanager.tvplayer.diagnostics.DeviceInfoProvider

class ClickTvJavascriptBridge(
    private val deviceInfoProvider: DeviceInfoProvider,
    private val controller: ClickTvWebViewController
) {
    @JavascriptInterface
    fun getDeviceInfo(): String {
        Log.d(TAG, "Bridge: getDeviceInfo")
        return deviceInfoProvider.getDeviceInfo().toJson()
    }

    @JavascriptInterface
    fun getVersion(): String = BuildConfig.VERSION_NAME

    @JavascriptInterface
    fun restart() {
        Log.i(TAG, "Bridge: restart")
        controller.reload()
    }

    @JavascriptInterface
    fun clearCache() {
        Log.i(TAG, "Bridge: clearCache")
        controller.clearCache()
    }

    private companion object {
        const val TAG = "ClickTV/Bridge"
    }
}
