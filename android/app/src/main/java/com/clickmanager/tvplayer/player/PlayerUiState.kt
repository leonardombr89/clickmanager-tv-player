package com.clickmanager.tvplayer.player

data class PlayerUiState(
    val isConnected: Boolean = true,
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)
