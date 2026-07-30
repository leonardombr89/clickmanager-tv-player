package com.clickmanager.tvplayer.webview

import android.graphics.Bitmap
import android.net.Uri
import android.util.Log
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

data class ClickTvWebViewCallbacks(
    val onPageStarted: () -> Unit,
    val onPageFinished: () -> Unit,
    val onError: (String) -> Unit
)

class ClickTvWebViewClient(
    configuredUrl: String,
    private val callbacks: ClickTvWebViewCallbacks
) : WebViewClient() {
    private val configuredOrigin = Uri.parse(configuredUrl)
    private var mainFrameFailed = false

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        mainFrameFailed = false
        Log.i(TAG, "Carregando URL: $url")
        callbacks.onPageStarted()
    }

    override fun onPageFinished(view: WebView?, url: String?) {
        Log.i(TAG, "URL carregada: $url")
        if (!mainFrameFailed) {
            callbacks.onPageFinished()
        }
    }

    override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
    ) {
        if (request?.isForMainFrame == true) {
            mainFrameFailed = true
            val message = error?.description?.toString().orEmpty()
                .ifBlank { "Não foi possível carregar o Player." }
            Log.e(TAG, "Erro ao carregar a página: $message")
            callbacks.onError(message)
        }
    }

    override fun onReceivedHttpError(
        view: WebView?,
        request: WebResourceRequest?,
        errorResponse: WebResourceResponse?
    ) {
        if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 400) {
            mainFrameFailed = true
            val message = "O Player respondeu com erro ${errorResponse?.statusCode}."
            Log.e(TAG, message)
            callbacks.onError(message)
        }
    }

    override fun shouldOverrideUrlLoading(
        view: WebView?,
        request: WebResourceRequest?
    ): Boolean {
        val target = request?.url ?: return true
        val allowed = target.scheme in setOf("http", "https") &&
            target.host.equals(configuredOrigin.host, ignoreCase = true) &&
            effectivePort(target) == effectivePort(configuredOrigin)

        if (!allowed) {
            Log.w(TAG, "Navegação externa bloqueada: $target")
        }
        return !allowed
    }

    override fun onRenderProcessGone(
        view: WebView?,
        detail: RenderProcessGoneDetail?
    ): Boolean {
        Log.e(TAG, "Processo da WebView encerrado")
        callbacks.onError("O Player foi interrompido. Tente novamente.")
        view?.destroy()
        return true
    }

    private fun effectivePort(uri: Uri): Int {
        if (uri.port != -1) return uri.port
        return if (uri.scheme == "https") 443 else 80
    }

    private companion object {
        const val TAG = "ClickTV/WebView"
    }
}
