package com.minibudget.quicklog

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class QuickLogModule : Module() {
  private val context get() = appContext.reactContext ?: throw IllegalStateException("No context")
  private val inbox: InboxStore by lazy { InboxStore(SharedPrefsInboxStorage(context, "pending")) }
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
