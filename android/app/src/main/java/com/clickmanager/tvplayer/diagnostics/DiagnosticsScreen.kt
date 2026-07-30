package com.clickmanager.tvplayer.diagnostics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.clickmanager.tvplayer.common.ClickTvHeader

@Composable
fun DiagnosticsScreen(
    provider: DeviceInfoProvider,
    onBack: () -> Unit
) {
    val info = remember { provider.getDeviceInfo() }
    val entries = listOf(
        "Modelo" to info.model,
        "Fabricante" to info.manufacturer,
        "Android" to "${info.androidVersion} (SDK ${info.sdkVersion})",
        "RAM" to "${info.availableRam} disponível / ${info.totalRam}",
        "Armazenamento" to "${info.availableStorage} disponível / ${info.totalStorage}",
        "IP" to info.ipAddress,
        "MAC" to info.macAddress,
        "Tempo online" to info.uptime,
        "Versão do App" to info.appVersion
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 48.dp, vertical = 32.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        ClickTvHeader(title = "Diagnóstico")
        entries.forEach { (label, value) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(label, style = MaterialTheme.typography.titleMedium)
                Text(value, style = MaterialTheme.typography.bodyLarge)
            }
            HorizontalDivider()
        }
        Button(onClick = onBack) {
            Text("Voltar")
        }
    }
}
