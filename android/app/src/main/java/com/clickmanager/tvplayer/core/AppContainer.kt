package com.clickmanager.tvplayer.core

import android.app.Application
import com.clickmanager.tvplayer.diagnostics.AndroidDeviceInfoProvider
import com.clickmanager.tvplayer.diagnostics.DeviceInfoProvider
import com.clickmanager.tvplayer.network.AndroidNetworkMonitor
import com.clickmanager.tvplayer.network.NetworkMonitor
import com.clickmanager.tvplayer.settings.DataStorePlayerSettingsRepository
import com.clickmanager.tvplayer.settings.PlayerSettingsRepository
import com.clickmanager.tvplayer.webview.ClickTvWebViewController

class AppContainer(application: Application) {
    val settingsRepository: PlayerSettingsRepository =
        DataStorePlayerSettingsRepository(application)
    val networkMonitor: NetworkMonitor = AndroidNetworkMonitor(application)
    val deviceInfoProvider: DeviceInfoProvider = AndroidDeviceInfoProvider(application)
    val webViewController = ClickTvWebViewController()
}
