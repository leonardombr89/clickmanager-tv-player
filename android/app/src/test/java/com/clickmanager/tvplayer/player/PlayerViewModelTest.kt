package com.clickmanager.tvplayer.player

import com.clickmanager.tvplayer.network.NetworkMonitor
import com.clickmanager.tvplayer.testutil.MainDispatcherRule
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PlayerViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `reflete perda de conexão sem deixar tela branca`() = runTest {
        val connectivity = MutableStateFlow(true)
        val viewModel = PlayerViewModel(FakeNetworkMonitor(connectivity))
        advanceUntilIdle()

        connectivity.value = false
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isConnected)
    }

    @Test
    fun `registra carregamento sucesso e erro da página`() = runTest {
        val viewModel = PlayerViewModel(FakeNetworkMonitor(MutableStateFlow(true)))

        viewModel.onPageFinished()
        assertFalse(viewModel.uiState.value.isLoading)

        viewModel.onPageError("Falha")
        assertEquals("Falha", viewModel.uiState.value.errorMessage)

        viewModel.retry {}
        assertTrue(viewModel.uiState.value.isLoading)
        assertEquals(null, viewModel.uiState.value.errorMessage)
    }

    private class FakeNetworkMonitor(
        override val isConnected: StateFlow<Boolean>
    ) : NetworkMonitor
}
