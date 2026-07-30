package com.clickmanager.tvplayer.settings

data class PlayerSettings(
    val playerUrl: String
) {
    val isConfigured: Boolean
        get() = playerUrl.isNotBlank()
}
