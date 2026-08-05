package com.clickmanager.tvplayer.webview

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.graphics.Color
import android.util.Log
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.clickmanager.tvplayer.BuildConfig
import com.clickmanager.tvplayer.diagnostics.DeviceInfoProvider

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ClickTvWebView(
    url: String,
    controller: ClickTvWebViewController,
    deviceInfoProvider: DeviceInfoProvider,
    callbacks: ClickTvWebViewCallbacks,
    modifier: Modifier = Modifier
) {
    AndroidView(
        modifier = modifier,
        factory = { context ->
            Log.i(TAG, "Criando WebView")
            WebView(context).apply {
                setBackgroundColor(Color.BLACK)
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                isFocusable = true
                isFocusableInTouchMode = true
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = false
                    allowContentAccess = false
                    mixedContentMode =
                        if (BuildConfig.ALLOW_CLEARTEXT && url.startsWith("http://")) {
                            WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        } else {
                            WebSettings.MIXED_CONTENT_NEVER_ALLOW
                        }
                }
                webChromeClient = WebChromeClient()
                webViewClient = ClickTvWebViewClient(url, callbacks)
                addJavascriptInterface(
                    ClickTvJavascriptBridge(
                        deviceInfoProvider,
                        controller,
                        context.findActivity()
                    ),
                    BRIDGE_NAME
                )
                controller.attach(this)
                loadUrl(url)
                requestFocus()
            }
        },
        update = { webView ->
            if (webView.url.isNullOrBlank()) {
                webView.loadUrl(url)
            }
        },
        onRelease = { webView ->
            Log.i(TAG, "Liberando WebView")
            controller.detach(webView)
            webView.stopLoading()
            webView.removeJavascriptInterface(BRIDGE_NAME)
            webView.destroy()
        }
    )
}

private const val TAG = "ClickTV/WebView"
private const val BRIDGE_NAME = "ClickTV"

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}
