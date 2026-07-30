package com.clickmanager.tvplayer.core.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val ClickTvColorScheme = lightColorScheme(
    primary = ClickTvPrimary,
    onPrimary = ClickTvBackground,
    primaryContainer = ClickTvSupport,
    onPrimaryContainer = ClickTvPrimaryDark,
    secondary = ClickTvSecondary,
    onSecondary = ClickTvBackground,
    background = ClickTvBackground,
    onBackground = ClickTvText,
    surface = ClickTvBackground,
    onSurface = ClickTvText,
    surfaceVariant = ClickTvSoftBackground,
    onSurfaceVariant = ClickTvSecondaryText,
    outline = ClickTvBorder
)

@Composable
fun ClickTvTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ClickTvColorScheme,
        content = content
    )
}
