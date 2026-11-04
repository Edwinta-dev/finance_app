package com.minibudget.quicklog

import android.content.Context

/** Android-backed storage: a private SharedPreferences file, deliberately not AsyncStorage. */
class SharedPrefsInboxStorage(context: Context) : InboxStorage {
  private val prefs = context.applicationContext.getSharedPreferences("quick_log_inbox", Context.MODE_PRIVATE)

  override fun read(): String? = prefs.getString(KEY, null)

  override fun write(value: String) {
    prefs.edit().putString(KEY, value).apply()
  }

  private companion object {
    const val KEY = "pending"
  }
}
