package com.clickmanager.tvplayer.core

/**
 * Ponto de extensão da futura inicialização por BOOT_COMPLETED.
 *
 * A Fase 1 não registra receiver nem inicia Activity em segundo plano.
 */
interface BootLaunchPolicy {
    fun isEnabled(): Boolean
}
