package com.minibudget.quicklog

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import java.util.Calendar

/** Posts nudges and the daily summary. Both are off unless the user enabled `nudges`. */
object Nudges {
  private const val CHANNEL_ID = "nudges"
  private const val NUDGE_ID = 4201
  private const val SUMMARY_ID = 4202
  private const val SUMMARY_HOUR = 20

  private fun channel(context: Context): NotificationManager {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_DEFAULT))
    }
    return nm
  }

  private fun open(context: Context, uri: String, code: Int): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(context, code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun postUnloggedSession(context: Context) {
    channel(context).notify(
      NUDGE_ID,
      Notification.Builder(context, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("Did you pay for something?")
        .setContentText("You left your bank app a few minutes ago and nothing was logged.")
        .setAutoCancel(true)
        .setContentIntent(open(context, DeepLink.log(), 21))
        .build(),
    )
  }

  fun postSummaryIfAny(context: Context) {
    val items = InboxStore(SharedPrefsInboxStorage(context, "pending")).getPending()
    val text = DailySummary.text(DailySummary.unconfirmedCount(items)) ?: return // skipped when zero
    channel(context).notify(
      SUMMARY_ID,
      Notification.Builder(context, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("Review your payments")
        .setContentText(text)
        .setAutoCancel(true)
        .setContentIntent(open(context, "${DeepLink.SCHEME}://review", 22))
        .build(),
    )
  }

  private fun summaryAlarm(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context, 23, Intent(context, SummaryReceiver::class.java).setAction("com.minibudget.quicklog.DAILY_SUMMARY"),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

  /** Inexact daily alarm around 20:00 local time; re-armed after reboot by [BootReceiver]. */
  fun scheduleDailySummary(context: Context) {
    val first = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, SUMMARY_HOUR); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
    }
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager)
      .setInexactRepeating(AlarmManager.RTC, first.timeInMillis, AlarmManager.INTERVAL_DAY, summaryAlarm(context))
  }

  fun cancelDailySummary(context: Context) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(summaryAlarm(context))
  }
}

class SummaryReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (Settings(SharedPrefsInboxStorage(context, "settings")).isEnabled(Settings.NUDGES)) Nudges.postSummaryIfAny(context)
  }
}
