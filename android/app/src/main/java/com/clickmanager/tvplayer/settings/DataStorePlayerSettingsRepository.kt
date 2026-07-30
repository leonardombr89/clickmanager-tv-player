package com.clickmanager.tvplayer.settings

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.clickmanager.tvplayer.BuildConfig
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

private val Context.playerDataStore by preferencesDataStore(name = "clicktv_player_settings")

class DataStorePlayerSettingsRepository(
    private val context: Context
) : PlayerSettingsRepository {
    override val settings: Flow<PlayerSettings> = context.playerDataStore.data
        .catch { error ->
            if (error is IOException) {
                emit(emptyPreferences())
            } else {
                throw error
            }
        }
        .map { preferences ->
            PlayerSettings(
                playerUrl = preferences[PLAYER_URL]
                    ?: PlayerUrlValidator.normalize(BuildConfig.DEFAULT_PLAYER_URL)
            )
        }

    override suspend fun savePlayerUrl(url: String) {
        context.playerDataStore.edit { preferences ->
            preferences[PLAYER_URL] = PlayerUrlValidator.normalize(url)
        }
    }

    private companion object {
        val PLAYER_URL = stringPreferencesKey("player_url")
    }
}
