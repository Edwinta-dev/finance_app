package com.minibudget.quicklog

import android.content.Context

/** Android-backed storage: a private SharedPreferences file, deliberately not AsyncStorage. */
class SharedPrefsInboxStorage(context: Context, private val key: String = "pending") : InboxStorage {
  private val prefs = context.applicationContext.getSharedPreferences("quick_log", Context.MODE_PRIVATE)

  override fun read(): String? = prefs.getString(key, null)

  override fun write(value: String) {
    prefs.edit().putString(key, value).apply()
  }
}
