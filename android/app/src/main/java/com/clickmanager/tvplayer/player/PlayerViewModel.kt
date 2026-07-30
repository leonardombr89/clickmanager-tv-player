package com.clickmanager.tvplayer.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.clickmanager.tvplayer.network.NetworkMonitor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PlayerViewModel(
    networkMonitor: NetworkMonitor
) : ViewModel() {
    private val mutableUiState = MutableStateFlow(
        PlayerUiState(isConnected = networkMonitor.isConnected.value)
    )
    val uiState: StateFlow<PlayerUiState> = mutableUiState.asStateFlow()

    init {
        viewModelScope.launch {
            networkMonitor.isConnected.collect { connected ->
                mutableUiState.update { state ->
                    state.copy(isConnected = connected)
                }
            }
        }
    }

    fun onPageStarted() {
        mutableUiState.update {
            it.copy(isLoading = true, errorMessage = null)
        }
    }

    fun onPageFinished() {
        mutableUiState.update {
            it.copy(isLoading = false, errorMessage = null)
        }
    }

    fun onPageError(message: String) {
        mutableUiState.update {
            it.copy(isLoading = false, errorMessage = message)
        }
    }

    fun retry(reload: () -> Unit) {
        mutableUiState.update {
            it.copy(isLoading = true, errorMessage = null)
        }
        reload()
    }

    companion object {
        fun factory(networkMonitor: NetworkMonitor): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return PlayerViewModel(networkMonitor) as T
                }
            }
    }
}
