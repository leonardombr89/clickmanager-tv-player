package com.clickmanager.tvplayer

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.clickmanager.tvplayer.core.ImmersiveMode
import com.clickmanager.tvplayer.core.theme.ClickTvTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i(TAG, "Aplicativo iniciado")
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        ImmersiveMode.apply(window)

        val container = (application as ClickTvApplication).container
        setContent {
            ClickTvTheme {
                ClickTvApp(container)
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            ImmersiveMode.apply(window)
        }
    }

    private companion object {
        const val TAG = "ClickTV/App"
    }
}
