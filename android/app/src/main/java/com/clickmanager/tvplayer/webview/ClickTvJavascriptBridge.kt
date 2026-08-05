package com.clickmanager.tvplayer.webview

import android.app.Activity
import android.content.pm.ActivityInfo
import android.util.Log
import android.webkit.JavascriptInterface
import com.clickmanager.tvplayer.BuildConfig
import com.clickmanager.tvplayer.diagnostics.DeviceInfoProvider

class ClickTvJavascriptBridge(
    private val deviceInfoProvider: DeviceInfoProvider,
    private val controller: ClickTvWebViewController,
    private val activity: Activity?
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

    @JavascriptInterface
    fun setOrientation(mode: String): Boolean {
        val hostActivity = activity ?: return false
        val requestedOrientation = when (mode.lowercase()) {
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE
            "automatic" -> ActivityInfo.SCREEN_ORIENTATION_FULL_USER
            else -> return false
        }

        Log.i(TAG, "Bridge: setOrientation($mode)")
        hostActivity.runOnUiThread {
            hostActivity.requestedOrientation = requestedOrientation
        }
        return true
    }

    private companion object {
        const val TAG = "ClickTV/Bridge"
    }
}
