package com.clickmanager.tvplayer

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.clickmanager.tvplayer.common.PlayerStatePanel
import com.clickmanager.tvplayer.core.AppContainer
import com.clickmanager.tvplayer.diagnostics.DiagnosticsScreen
import com.clickmanager.tvplayer.player.PlayerScreen
import com.clickmanager.tvplayer.player.PlayerViewModel
import com.clickmanager.tvplayer.settings.SettingsScreen

@Composable
fun ClickTvApp(container: AppContainer) {
    val appViewModel: ClickTvAppViewModel = viewModel(
        factory = ClickTvAppViewModel.factory(container.settingsRepository)
    )
    val playerViewModel: PlayerViewModel = viewModel(
        key = "clicktv-player",
        factory = PlayerViewModel.factory(container.networkMonitor)
    )
    val state by appViewModel.uiState.collectAsStateWithLifecycle()

    when (state.screen) {
        AppScreen.INITIALIZING -> PlayerStatePanel(
            title = "Carregando...",
            loading = true
        )

        AppScreen.INITIAL_CONFIGURATION -> SettingsScreen(
            currentUrl = state.playerUrl,
            allowCleartext = BuildConfig.ALLOW_CLEARTEXT,
            initialConfiguration = true,
            isSaving = state.isSaving,
            onSave = appViewModel::saveUrl,
            onClearCache = container.webViewController::clearCache,
            onReload = container.webViewController::reload,
            onDiagnostics = appViewModel::openDiagnostics,
            onBack = appViewModel::openPlayer
        )

        AppScreen.PLAYER -> PlayerScreen(
            url = state.playerUrl,
            viewModel = playerViewModel,
            controller = container.webViewController,
            deviceInfoProvider = container.deviceInfoProvider,
            onOpenSettings = appViewModel::openSettings
        )

        AppScreen.SETTINGS -> SettingsScreen(
            currentUrl = state.playerUrl,
            allowCleartext = BuildConfig.ALLOW_CLEARTEXT,
            initialConfiguration = false,
            isSaving = state.isSaving,
            onSave = appViewModel::saveUrl,
            onClearCache = container.webViewController::clearCache,
            onReload = {
                container.webViewController.reload()
                appViewModel.openPlayer()
            },
            onDiagnostics = appViewModel::openDiagnostics,
            onBack = appViewModel::openPlayer
        )

        AppScreen.DIAGNOSTICS -> DiagnosticsScreen(
            provider = container.deviceInfoProvider,
            onBack = appViewModel::openSettings
        )
    }
}
