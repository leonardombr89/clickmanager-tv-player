package com.clickmanager.tvplayer.diagnostics

import org.json.JSONObject

data class DeviceInfo(
    val model: String,
    val manufacturer: String,
    val androidVersion: String,
    val sdkVersion: Int,
    val totalRam: String,
    val availableRam: String,
    val totalStorage: String,
    val availableStorage: String,
    val ipAddress: String,
    val macAddress: String,
    val uptime: String,
    val appVersion: String
) {
    fun toJson(): String = JSONObject()
        .put("model", model)
        .put("manufacturer", manufacturer)
        .put("androidVersion", androidVersion)
        .put("sdkVersion", sdkVersion)
        .put("totalRam", totalRam)
        .put("availableRam", availableRam)
        .put("totalStorage", totalStorage)
        .put("availableStorage", availableStorage)
        .put("ipAddress", ipAddress)
        .put("macAddress", macAddress)
        .put("uptime", uptime)
        .put("appVersion", appVersion)
        .toString()
}
