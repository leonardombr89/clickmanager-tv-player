package com.clickmanager.tvplayer.common

import android.os.SystemClock
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp

@Composable
fun SettingsGestureOverlay(
    onUnlocked: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tracker = remember { FiveTapTracker() }

    Box(
        modifier = modifier
            .size(width = 200.dp, height = 110.dp)
            .pointerInput(onUnlocked) {
                detectTapGestures {
                    if (tracker.registerTap()) {
                        onUnlocked()
                    }
                }
            }
    )
}

internal class FiveTapTracker(
    private val timeoutMillis: Long = 3_000
) {
    private var taps = 0
    private var firstTapAt = 0L

    fun registerTap(now: Long = SystemClock.elapsedRealtime()): Boolean {
        if (taps == 0 || now - firstTapAt > timeoutMillis) {
            taps = 1
            firstTapAt = now
            return false
        }

        taps += 1
        if (taps >= REQUIRED_TAPS) {
            taps = 0
            firstTapAt = 0L
            return true
        }
        return false
    }

    private companion object {
        const val REQUIRED_TAPS = 5
    }
}
