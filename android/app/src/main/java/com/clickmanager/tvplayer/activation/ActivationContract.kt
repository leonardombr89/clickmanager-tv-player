package com.clickmanager.tvplayer.activation

/**
 * Contrato reservado para uma futura ativação nativa.
 *
 * No MVP, o fluxo de ativação continua pertencendo ao player Angular carregado
 * pela WebView.
 */
interface ActivationContract {
    suspend fun requestActivation(): Result<String>
}
