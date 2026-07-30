package com.clickmanager.tvplayer.webview

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.WebView
import java.lang.ref.WeakReference

class ClickTvWebViewController {
    private val mainHandler = Handler(Looper.getMainLooper())
    private var webViewReference = WeakReference<WebView>(null)

    fun attach(webView: WebView) {
        webViewReference = WeakReference(webView)
    }

    fun detach(webView: WebView) {
        if (webViewReference.get() === webView) {
            webViewReference.clear()
        }
    }

    fun reload() {
        mainHandler.post {
            Log.i(TAG, "Reload solicitado")
            webViewReference.get()?.reload()
        }
    }

    fun clearCache(onComplete: (() -> Unit)? = null) {
        mainHandler.post {
            Log.i(TAG, "Limpeza de cache solicitada")
            webViewReference.get()?.apply {
                clearCache(true)
                clearHistory()
            }
            onComplete?.invoke()
        }
    }

    private companion object {
        const val TAG = "ClickTV/WebView"
    }
}
