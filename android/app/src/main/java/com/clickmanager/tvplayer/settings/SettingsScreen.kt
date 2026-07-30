package com.clickmanager.tvplayer.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.clickmanager.tvplayer.common.ClickTvHeader

@Composable
fun SettingsScreen(
    currentUrl: String,
    allowCleartext: Boolean,
    initialConfiguration: Boolean,
    isSaving: Boolean,
    onSave: (String) -> Unit,
    onClearCache: (onComplete: () -> Unit) -> Unit,
    onReload: () -> Unit,
    onDiagnostics: () -> Unit,
    onBack: () -> Unit
) {
    var url by rememberSaveable { mutableStateOf(currentUrl) }
    var validationError by remember { mutableStateOf<String?>(null) }
    var feedback by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(currentUrl) {
        if (url.isBlank()) {
            url = currentUrl
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 64.dp, vertical = 40.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        ClickTvHeader(
            title = if (initialConfiguration) {
                "Configure o endereço do Player"
            } else {
                "Configurações protegidas"
            }
        )

        OutlinedTextField(
            value = url,
            onValueChange = {
                url = it
                validationError = null
                feedback = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("URL do Player") },
            placeholder = { Text("https://tv.clickmanager.com.br") },
            supportingText = {
                Text(
                    validationError
                        ?: "Desenvolvimento: use o endereço IP do computador e a porta 4300."
                )
            },
            isError = validationError != null,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            singleLine = true
        )

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Button(
                enabled = !isSaving,
                onClick = {
                    validationError = PlayerUrlValidator.errorFor(url, allowCleartext)
                    if (validationError == null) {
                        onSave(PlayerUrlValidator.normalize(url))
                    }
                }
            ) {
                Text(if (isSaving) "Salvando..." else "Salvar")
            }

            if (!initialConfiguration) {
                OutlinedButton(onClick = onBack) {
                    Text("Voltar ao Player")
                }
            }
        }

        if (!initialConfiguration) {
            Text(
                text = "Manutenção",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedButton(
                    onClick = {
                        onClearCache {
                            feedback = "Cache limpo."
                        }
                    }
                ) {
                    Text("Limpar Cache")
                }
                OutlinedButton(onClick = onReload) {
                    Text("Recarregar")
                }
                OutlinedButton(onClick = onDiagnostics) {
                    Text("Informações do dispositivo")
                }
            }
        }

        feedback?.let {
            Text(
                text = it,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
