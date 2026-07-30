package com.clickmanager.tvplayer.common

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FiveTapTrackerTest {
    @Test
    fun `desbloqueia no quinto toque dentro do prazo`() {
        val tracker = FiveTapTracker(timeoutMillis = 3_000)

        assertFalse(tracker.registerTap(1_000))
        assertFalse(tracker.registerTap(1_200))
        assertFalse(tracker.registerTap(1_400))
        assertFalse(tracker.registerTap(1_600))
        assertTrue(tracker.registerTap(1_800))
    }

    @Test
    fun `reinicia contagem depois do prazo`() {
        val tracker = FiveTapTracker(timeoutMillis = 3_000)

        assertFalse(tracker.registerTap(1_000))
        assertFalse(tracker.registerTap(1_200))
        assertFalse(tracker.registerTap(5_000))
        assertFalse(tracker.registerTap(5_200))
    }
}
