package com.clickmanager.tvplayer

import android.app.Application
import com.clickmanager.tvplayer.core.AppContainer

class ClickTvApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
