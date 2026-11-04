package com.minibudget.quicklog

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restores the logging notification after a reboot, but only if the user opted in. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    val settings = Settings(SharedPrefsInboxStorage(context, "settings"))
    if (settings.isEnabled(Settings.NOTIFICATION_LOGGING)) LoggingService.start(context)
    if (settings.isEnabled(Settings.BANK_CAMERA_SIGNALS) && UsageSignalMonitor.hasUsageAccess(context)) SignalService.start(context)
  }
}
