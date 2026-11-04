package com.minibudget.quicklog

import expo.modules.kotlin.modules.Module
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
