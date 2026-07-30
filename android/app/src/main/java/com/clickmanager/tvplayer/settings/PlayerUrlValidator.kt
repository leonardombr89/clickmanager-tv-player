package com.clickmanager.tvplayer.settings

import java.net.URI

object PlayerUrlValidator {
    fun normalize(rawValue: String): String = rawValue.trim().trimEnd('/')

    fun errorFor(rawValue: String, allowCleartext: Boolean): String? {
        val value = normalize(rawValue)
        if (value.isBlank()) {
            return "Informe a URL do Player."
        }

        val uri = runCatching { URI(value) }.getOrNull()
            ?: return "Informe uma URL válida."
        val scheme = uri.scheme?.lowercase()
        if (scheme != "https" && scheme != "http") {
            return "A URL deve começar com https://."
        }
        if (scheme == "http" && !allowCleartext) {
            return "Esta versão aceita apenas URLs HTTPS."
        }
        if (uri.host.isNullOrBlank()) {
            return "Informe uma URL com host válido."
        }
        return null
    }
}
