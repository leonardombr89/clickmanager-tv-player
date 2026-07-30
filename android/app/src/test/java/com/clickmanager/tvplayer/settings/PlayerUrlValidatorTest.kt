package com.clickmanager.tvplayer.settings

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlayerUrlValidatorTest {
    @Test
    fun `aceita https em qualquer ambiente`() {
        assertNull(
            PlayerUrlValidator.errorFor(
                "https://tv.clickmanager.com.br",
                allowCleartext = false
            )
        )
    }

    @Test
    fun `aceita http apenas no ambiente de desenvolvimento`() {
        assertNull(
            PlayerUrlValidator.errorFor(
                "http://192.168.2.182:4300",
                allowCleartext = true
            )
        )
        assertEquals(
            "Esta versão aceita apenas URLs HTTPS.",
            PlayerUrlValidator.errorFor(
                "http://192.168.2.182:4300",
                allowCleartext = false
            )
        )
    }

    @Test
    fun `normaliza espaços e barra final`() {
        assertEquals(
            "https://tv.clickmanager.com.br",
            PlayerUrlValidator.normalize(" https://tv.clickmanager.com.br/ ")
        )
    }

    @Test
    fun `rejeita protocolo não suportado`() {
        assertEquals(
            "A URL deve começar com https://.",
            PlayerUrlValidator.errorFor("file:///tmp/player", allowCleartext = true)
        )
    }
}
