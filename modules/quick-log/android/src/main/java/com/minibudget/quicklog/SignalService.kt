package com.minibudget.quicklog

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/** Hosts [UsageSignalMonitor] while the user has the bank-app/camera signal switched on. */
class SignalService : Service() {
  private var monitor: UsageSignalMonitor? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val settings = Settings(SharedPrefsInboxStorage(this, "settings"))
    if (!settings.isEnabled(Settings.BANK_CAMERA_SIGNALS) || intent?.action == ACTION_STOP || !UsageSignalMonitor.hasUsageAccess(this)) {
      monitor?.stop(); monitor = null
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Payment hints", NotificationManager.IMPORTANCE_MIN))
    }
    val notification = Notification.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_view)
      .setContentTitle("Watching for payment hints")
      .setContentText("Bank app opened after the camera. Turn off in MiniBudget settings.")
      .setOngoing(true)
      .build()
    if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(NOTIFICATION_ID, notification)
    if (monitor == null) monitor = UsageSignalMonitor(this).also { it.start() }
    return START_STICKY
  }

  override fun onDestroy() {
    monitor?.stop(); monitor = null
    super.onDestroy()
  }

  companion object {
    private const val CHANNEL_ID = "signals"
    private const val NOTIFICATION_ID = 4102
    const val ACTION_STOP = "com.minibudget.quicklog.STOP_SIGNALS"

    fun start(context: Context) = context.startForegroundService(Intent(context, SignalService::class.java))
    fun stop(context: Context) {
      context.startService(Intent(context, SignalService::class.java).setAction(ACTION_STOP))
    }
  }
}
