package com.minibudget.quicklog

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Reads bank-app notifications and turns matches into unconfirmed inbox candidates.
 * Does nothing unless the user granted Notification Access AND turned on the in-app bank-notification toggle.
 * All other packages are ignored before their text is read.
 */
class BankNotificationListener : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    sbn ?: return
    val settings = Settings(SharedPrefsInboxStorage(this, "settings"))
    if (!settings.isEnabled(Settings.BANK_NOTIFICATIONS)) return

    val config = { BankConfig.parse(SharedPrefsInboxStorage(this, "bank_config").read()) }
    if (config().templateFor(sbn.packageName) == null) return

    val extras = sbn.notification?.extras ?: return
    val text = listOf(Notification.EXTRA_TITLE, Notification.EXTRA_TEXT, Notification.EXTRA_BIG_TEXT)
      .mapNotNull { extras.getCharSequence(it)?.toString() }
      .distinct()
      .joinToString(" ")

    BankNotificationHandler(settings, config, InboxStore(SharedPrefsInboxStorage(this, "pending")))
      .handle(sbn.packageName, text, sbn.postTime)
  }
}
