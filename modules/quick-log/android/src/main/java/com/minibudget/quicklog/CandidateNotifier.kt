package com.minibudget.quicklog

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.net.Uri

/** Posts the heads-up confirmation prompt for an unconfirmed candidate. */
object CandidateNotifier {
  private const val CHANNEL_ID = "candidates"
  const val ACTION = "com.minibudget.quicklog.CANDIDATE_ACTION"
  const val EXTRA_ID = "id"
  const val EXTRA_KIND = "kind"
  const val EXTRA_CATEGORY = "category"

  fun post(context: Context, item: PendingTransaction) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL_ID) == null) {
      nm.createNotificationChannel(NotificationChannel(CHANNEL_ID, "Confirm payments", NotificationManager.IMPORTANCE_HIGH))
    }
    val mirror = Mirror.parse(SharedPrefsInboxStorage(context, "mirror").read())
    val recent = RecentCategories(SharedPrefsInboxStorage(context, "recent")).get()
    val prompt = CandidatePrompt.build(item, mirror, recent)
    val notifId = notificationId(item.id)

    val open = Intent(Intent.ACTION_VIEW, Uri.parse("${DeepLink.SCHEME}://review")).setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    val builder = Notification.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(prompt.title)
      .setContentText(prompt.text)
      .setAutoCancel(true)
      .setContentIntent(PendingIntent.getActivity(context, notifId, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))

    prompt.actions.forEachIndexed { i, action ->
      val intent = Intent(context, CandidateActionReceiver::class.java)
        .setAction(ACTION)
        .putExtra(EXTRA_ID, item.id)
        .putExtra(EXTRA_KIND, action.kind.name)
        .putExtra(EXTRA_CATEGORY, action.category)
      val pending = PendingIntent.getBroadcast(context, notifId + i + 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      builder.addAction(Notification.Action.Builder(Icon.createWithResource(context, android.R.drawable.ic_input_add), action.label, pending).build())
    }
    nm.notify(notifId, builder.build())
  }

  fun notificationId(itemId: String): Int = 10_000 + (itemId.hashCode() and 0x0FFF_FFF) % 1_000_000
}

/** Handles taps on the prompt's buttons. */
class CandidateActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != CandidateNotifier.ACTION) return
    val id = intent.getStringExtra(CandidateNotifier.EXTRA_ID) ?: return
    val kind = runCatching { PromptKind.valueOf(intent.getStringExtra(CandidateNotifier.EXTRA_KIND).orEmpty()) }.getOrNull() ?: return
    val action = PromptAction("", kind, intent.getStringExtra(CandidateNotifier.EXTRA_CATEGORY))
    val inbox = InboxStore(SharedPrefsInboxStorage(context, "pending"))
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    fun finish(location: PendingLocation?) {
      if (CandidateResolver.apply(inbox, id, action, location) && kind == PromptKind.CATEGORY) {
        LogTimes(SharedPrefsInboxStorage(context, "log_times")).record(System.currentTimeMillis())
      }
      if (kind == PromptKind.CATEGORY) action.category?.let { RecentCategories(SharedPrefsInboxStorage(context, "recent")).record(it) }
      nm.cancel(CandidateNotifier.notificationId(id))
    }

    if (kind == PromptKind.CATEGORY) {
      // Capture on tap (best effort: Android may deny location to a background process).
      val pending = goAsync()
      LocationCapture.capture(context) { location -> finish(location); pending.finish() }
    } else {
      finish(null)
    }
  }
}
