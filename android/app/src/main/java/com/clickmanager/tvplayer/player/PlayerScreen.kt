package com.clickmanager.tvplayer.player

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.clickmanager.tvplayer.common.PlayerStatePanel
import com.clickmanager.tvplayer.common.SettingsGestureOverlay
import com.clickmanager.tvplayer.diagnostics.DeviceInfoProvider
import com.clickmanager.tvplayer.webview.ClickTvWebView
import com.clickmanager.tvplayer.webview.ClickTvWebViewCallbacks
import com.clickmanager.tvplayer.webview.ClickTvWebViewController

@Composable
fun PlayerScreen(
    url: String,
    viewModel: PlayerViewModel,
    controller: ClickTvWebViewController,
    deviceInfoProvider: DeviceInfoProvider,
    onOpenSettings: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        ClickTvWebView(
            url = url,
            controller = controller,
            deviceInfoProvider = deviceInfoProvider,
            callbacks = ClickTvWebViewCallbacks(
                onPageStarted = viewModel::onPageStarted,
                onPageFinished = viewModel::onPageFinished,
                onError = viewModel::onPageError
            ),
            modifier = Modifier.fillMaxSize()
        )

        when {
            !state.isConnected -> PlayerStatePanel(
                title = "Sem conexão",
                message = "Verifique o Wi-Fi ou o cabo de rede.",
                actionLabel = "Tentar novamente",
                onAction = { viewModel.retry(controller::reload) }
            )

            state.errorMessage != null -> PlayerStatePanel(
                title = "Não foi possível abrir o Player",
                message = state.errorMessage,
                actionLabel = "Tentar novamente",
                onAction = { viewModel.retry(controller::reload) }
            )

            state.isLoading -> PlayerStatePanel(
                title = "Carregando...",
                loading = true
            )
        }

        SettingsGestureOverlay(
            onUnlocked = onOpenSettings,
            modifier = Modifier.align(Alignment.TopStart)
        )
    }
}
