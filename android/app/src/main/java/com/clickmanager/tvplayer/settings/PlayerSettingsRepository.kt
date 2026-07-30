package com.clickmanager.tvplayer.settings

import kotlinx.coroutines.flow.Flow

interface PlayerSettingsRepository {
    val settings: Flow<PlayerSettings>

    suspend fun savePlayerUrl(url: String)
}
