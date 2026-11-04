package com.minibudget.quicklog

import org.json.JSONObject

/** Native-side opt-in flags (all default off). Plain JVM over an [InboxStorage]. */
class Settings(private val storage: InboxStorage) {
  @Synchronized
  fun isEnabled(key: String): Boolean = read().optBoolean(key, false)

  @Synchronized
  fun set(key: String, enabled: Boolean) {
    val o = read()
    o.put(key, enabled)
    storage.write(o.toString())
  }

  private fun read(): JSONObject =
    try { JSONObject(storage.read() ?: "{}") } catch (e: Exception) { JSONObject() }

  companion object {
    const val NOTIFICATION_LOGGING = "notificationLogging"
    const val BANK_NOTIFICATIONS = "bankNotifications"
    const val KEEP_RAW_TEXT = "keepRawText"
    const val BANK_CAMERA_SIGNALS = "bankCameraSignals"
    const val LOCATION_CAPTURE = "locationCapture"
    const val ROUND_LOCATION = "roundLocation"
    const val REVERSE_GEOCODING = "reverseGeocoding"
  }
}
