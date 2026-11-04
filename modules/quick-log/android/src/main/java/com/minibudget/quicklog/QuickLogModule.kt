package com.minibudget.quicklog

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class QuickLogModule : Module() {
  private val context get() = appContext.reactContext ?: throw IllegalStateException("No context")
  private val inbox: InboxStore by lazy { InboxStore(SharedPrefsInboxStorage(context, "pending")) }
  private val settings: Settings by lazy { Settings(SharedPrefsInboxStorage(context, "settings")) }
  private val mirror: MirrorStore by lazy { MirrorStore(SharedPrefsInboxStorage(context, "mirror")) }

  override fun definition() = ModuleDefinition {
    Name("QuickLog")

    Function("ping") { Echo.echo("quick-log") }

    AsyncFunction("getPending") {
      // Returned as a JSON string array parsed back into maps by Expo.
      inbox.getPending().map { toMap(it.toJson()) }
    }

    /** Stores {outflowCategories, inflowCategories, accounts:[{id,name}]}; JS never sends balances. */
    AsyncFunction("setMirror") { json: String ->
      mirror.save(json)
    }

    /** Opt-in switch for the ongoing logging notification; persisted natively so boot can restore it. */
    AsyncFunction("setLoggingEnabled") { enabled: Boolean ->
      settings.set(Settings.NOTIFICATION_LOGGING, enabled)
      if (enabled) LoggingService.start(context) else LoggingService.stop(context)
    }

    AsyncFunction("isLoggingEnabled") {
      settings.isEnabled(Settings.NOTIFICATION_LOGGING)
    }

    /** Generic opt-in flags (bank notifications, raw-text retention, ...). All default off. */
    AsyncFunction("setSetting") { key: String, enabled: Boolean ->
      settings.set(key, enabled)
      if (key == Settings.BANK_CAMERA_SIGNALS || key == Settings.NUDGES) {
        val wanted = settings.isEnabled(Settings.BANK_CAMERA_SIGNALS) || settings.isEnabled(Settings.NUDGES)
        if (wanted && UsageSignalMonitor.hasUsageAccess(context)) SignalService.start(context) else SignalService.stop(context)
      }
      if (key == Settings.NUDGES) {
        if (enabled) Nudges.scheduleDailySummary(context) else Nudges.cancelDailySummary(context)
      }
    }

    AsyncFunction("getSetting") { key: String ->
      settings.isEnabled(key)
    }

    /** JSON `{"packages": {"<pkg>": "<templateId>"}}`; replaces the bank package list. */
    AsyncFunction("setBankConfig") { json: String ->
      SharedPrefsInboxStorage(context, "bank_config").write(json)
    }

    /** Opens the system screen where the user grants Notification Access. */
    AsyncFunction("openNotificationAccessSettings") {
      val intent = android.content.Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
        .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    /** Minutes after a bank-app session ends before a nudge is considered (default 5). */
    AsyncFunction("setNudgeMinutes") { minutes: Int ->
      SharedPrefsInboxStorage(context, "nudge_minutes").write(NudgePolicy(minutes).nudgeMinutes.toString())
    }

    /** JS tells native when the user logs a transaction in the app, so nudges stay quiet. */
    AsyncFunction("noteLogged") { ts: Double ->
      LogTimes(SharedPrefsInboxStorage(context, "log_times")).record(ts.toLong())
    }

    AsyncFunction("hasUsageAccess") { UsageSignalMonitor.hasUsageAccess(context) }

    /** Opens the system Usage Access screen (user grants it there). */
    AsyncFunction("openUsageAccessSettings") {
      context.startActivity(
        android.content.Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
          .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    /** Milliseconds between a camera use and a bank-app open for them to count as related. */
    AsyncFunction("setSignalWindowMs") { ms: Double ->
      SharedPrefsInboxStorage(context, "signal_window").write(ms.toLong().toString())
    }

    /** One-shot location for the in-app confirm flow. Resolves null when disabled, not permitted or unavailable. */
    AsyncFunction("captureLocation") { promise: Promise ->
      LocationCapture.capture(context) { loc -> promise.resolve(loc?.let { toMap(it.toJson()) }) }
    }

    AsyncFunction("ack") { ids: List<String> ->
      inbox.ack(ids)
    }
  }

  private fun toMap(o: JSONObject): Map<String, Any?> =
    o.keys().asSequence().associateWith { k ->
      when (val v = o.get(k)) {
        is JSONObject -> toMap(v)
        is JSONArray -> (0 until v.length()).map { v.get(it) }
        JSONObject.NULL -> null
        else -> v
      }
    }
}
