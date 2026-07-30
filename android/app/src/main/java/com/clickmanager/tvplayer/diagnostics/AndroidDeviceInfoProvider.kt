package com.clickmanager.tvplayer.diagnostics

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.SystemClock
import android.text.format.Formatter
import com.clickmanager.tvplayer.BuildConfig
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

class AndroidDeviceInfoProvider(
    private val context: Context
) : DeviceInfoProvider {
    override fun getDeviceInfo(): DeviceInfo {
        val memoryInfo = ActivityManager.MemoryInfo()
        context.getSystemService(ActivityManager::class.java).getMemoryInfo(memoryInfo)
        val storage = StatFs(Environment.getDataDirectory().path)

        return DeviceInfo(
            model = Build.MODEL.orUnknown(),
            manufacturer = Build.MANUFACTURER.orUnknown(),
            androidVersion = Build.VERSION.RELEASE.orUnknown(),
            sdkVersion = Build.VERSION.SDK_INT,
            totalRam = Formatter.formatFileSize(context, memoryInfo.totalMem),
            availableRam = Formatter.formatFileSize(context, memoryInfo.availMem),
            totalStorage = Formatter.formatFileSize(context, storage.totalBytes),
            availableStorage = Formatter.formatFileSize(context, storage.availableBytes),
            ipAddress = findIpAddress(),
            macAddress = findMacAddress(),
            uptime = formatUptime(SystemClock.elapsedRealtime()),
            appVersion = BuildConfig.VERSION_NAME
        )
    }

    private fun findIpAddress(): String {
        return networkInterfaces()
            .flatMap { network -> Collections.list(network.inetAddresses) }
            .firstOrNull { address ->
                !address.isLoopbackAddress && address is Inet4Address
            }
            ?.hostAddress
            .orUnknown()
    }

    private fun findMacAddress(): String {
        return networkInterfaces()
            .asSequence()
            .filter { it.name == "eth0" || it.name == "wlan0" }
            .mapNotNull { it.hardwareAddress }
            .firstOrNull()
            ?.joinToString(":") { byte -> "%02X".format(byte.toInt() and 0xFF) }
            .orUnknown()
    }

    private fun networkInterfaces(): List<NetworkInterface> {
        return runCatching {
            Collections.list(NetworkInterface.getNetworkInterfaces())
        }.getOrDefault(emptyList())
    }

    private fun formatUptime(milliseconds: Long): String {
        val totalSeconds = milliseconds / 1_000
        val days = totalSeconds / 86_400
        val hours = (totalSeconds % 86_400) / 3_600
        val minutes = (totalSeconds % 3_600) / 60
        return "${days}d ${hours}h ${minutes}min"
    }

    private fun String?.orUnknown(): String =
        this?.takeIf { it.isNotBlank() } ?: "Indisponível"
}
