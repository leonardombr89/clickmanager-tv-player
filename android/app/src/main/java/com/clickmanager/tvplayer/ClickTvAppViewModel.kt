package com.clickmanager.tvplayer

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.clickmanager.tvplayer.settings.PlayerSettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AppScreen {
    INITIALIZING,
    INITIAL_CONFIGURATION,
    PLAYER,
    SETTINGS,
    DIAGNOSTICS
}

data class ClickTvAppUiState(
    val screen: AppScreen = AppScreen.INITIALIZING,
    val playerUrl: String = "",
    val isSaving: Boolean = false
)

class ClickTvAppViewModel(
    private val settingsRepository: PlayerSettingsRepository
) : ViewModel() {
    private val mutableUiState = MutableStateFlow(ClickTvAppUiState())
    val uiState: StateFlow<ClickTvAppUiState> = mutableUiState.asStateFlow()
    private var initialized = false

    init {
        viewModelScope.launch {
            settingsRepository.settings.collect { settings ->
                mutableUiState.update { current ->
                    val resolvedScreen = if (!initialized) {
                        initialized = true
                        if (settings.isConfigured) {
                            Log.i(TAG, "URL configurada; abrindo Player")
                            AppScreen.PLAYER
                        } else {
                            Log.i(TAG, "URL ausente; abrindo configuração inicial")
                            AppScreen.INITIAL_CONFIGURATION
                        }
                    } else {
                        current.screen
                    }
                    current.copy(
                        screen = resolvedScreen,
                        playerUrl = settings.playerUrl
                    )
                }
            }
        }
    }

    fun saveUrl(url: String) {
        viewModelScope.launch {
            mutableUiState.update { it.copy(isSaving = true) }
            runCatching {
                settingsRepository.savePlayerUrl(url)
            }.onSuccess {
                Log.i(TAG, "URL do Player salva")
                mutableUiState.update {
                    it.copy(
                        screen = AppScreen.PLAYER,
                        playerUrl = url,
                        isSaving = false
                    )
                }
            }.onFailure { error ->
                Log.e(TAG, "Falha ao salvar URL", error)
                mutableUiState.update { it.copy(isSaving = false) }
            }
        }
    }

    fun openSettings() {
        mutableUiState.update { it.copy(screen = AppScreen.SETTINGS) }
    }

    fun openDiagnostics() {
        mutableUiState.update { it.copy(screen = AppScreen.DIAGNOSTICS) }
    }

    fun openPlayer() {
        mutableUiState.update {
            it.copy(
                screen = if (it.playerUrl.isBlank()) {
                    AppScreen.INITIAL_CONFIGURATION
                } else {
                    AppScreen.PLAYER
                }
            )
        }
    }

    companion object {
        private const val TAG = "ClickTV/App"

        fun factory(repository: PlayerSettingsRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return ClickTvAppViewModel(repository) as T
                }
            }
    }
}
