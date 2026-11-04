package com.minibudget.quicklog

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.RemoteInput
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.widget.Toast

/**
 * Ongoing notification with one-tap category actions. Each category action carries an amount
 * RemoteInput: tap a category, type the amount, send. Works from the lock screen.
 * Logic lives in the plain-JVM classes (QuickLogger, NotificationPlan); this class only wires Android.
 */
class LoggingService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val settings = Settings(SharedPrefsInboxStorage(this, "settings"))
    if (!settings.isEnabled(Settings.NOTIFICATION_LOGGING) || intent?.action == ACTION_STOP) {
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    var last: PendingTransaction? = null
    if (intent?.action == ACTION_LOG) {
      val category = intent.getStringExtra(EXTRA_CATEGORY).orEmpty()
      val typed = RemoteInput.getResultsFromIntent(intent)?.getCharSequence(KEY_AMOUNT)?.toString()
      when (val result = logger().log(typed, category)) {
        is LogResult.Logged -> last = result.item
        LogResult.InvalidAmount -> Toast.makeText(this, "Enter an amount like 12 or 12.50", Toast.LENGTH_SHORT).show()
      }
    }

    val notification = buildNotification(last)
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    return START_STICKY
  }

  private fun logger() = QuickLogger(
    InboxStore(SharedPrefsInboxStorage(this, "pending")),
    RecentCategories(SharedPrefsInboxStorage(this, "recent")),
  )

  private fun buildNotification(last: PendingTransaction?): Notification {
    ensureChannel()
    val mirror = Mirror.parse(SharedPrefsInboxStorage(this, "mirror").read())
    val recent = RecentCategories(SharedPrefsInboxStorage(this, "recent")).get()
    val plan = NotificationPlan.build(mirror, recent, last)

    val builder = Notification.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_input_add)
      .setContentTitle(plan.title)
      .setContentText(plan.text)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setContentIntent(openAppIntent(plan.otherDeepLink)) // "Other": opens the full log screen
      .setDeleteIntent(repostIntent())

    plan.categoryActions.forEachIndexed { index, category ->
      val remoteInput = RemoteInput.Builder(KEY_AMOUNT).setLabel("Amount for $category").build()
      val intent = Intent(this, LoggingService::class.java)
        .setAction(ACTION_LOG)
        .putExtra(EXTRA_CATEGORY, category)
      // RemoteInput needs a mutable PendingIntent so the system can attach the typed text.
      val pending = PendingIntent.getForegroundService(this, 100 + index, intent, mutableFlags())
      builder.addAction(
        Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_input_add), category, pending)
          .addRemoteInput(remoteInput)
          .build()
      )
    }
    return builder.build()
  }

  private fun openAppIntent(deepLink: String): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(this, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /** Android 14+ lets users swipe away foreground-service notifications; re-post when that happens. */
  private fun repostIntent(): PendingIntent {
    val intent = Intent(this, LoggingService::class.java).setAction(ACTION_REPOST)
    return PendingIntent.getForegroundService(this, 2, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun mutableFlags(): Int =
    PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0

  private fun ensureChannel() {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      val channel = NotificationChannel(CHANNEL_ID, "Quick log", NotificationManager.IMPORTANCE_LOW)
      channel.description = "Ongoing notification for logging spending in two taps"
      channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      nm.createNotificationChannel(channel)
    }
  }

  companion object {
    const val CHANNEL_ID = "quick_log"
    const val NOTIFICATION_ID = 4101
    const val KEY_AMOUNT = "amount"
    const val EXTRA_CATEGORY = "category"
    const val ACTION_LOG = "com.minibudget.quicklog.LOG"
    const val ACTION_REPOST = "com.minibudget.quicklog.REPOST"
    const val ACTION_STOP = "com.minibudget.quicklog.STOP"

    fun start(context: Context) {
      context.startForegroundService(Intent(context, LoggingService::class.java))
    }

    fun stop(context: Context) {
      context.startService(Intent(context, LoggingService::class.java).setAction(ACTION_STOP))
    }
  }
}
