package com.minibudget.quicklog

import org.json.JSONObject

/**
 * Which app packages are treated as banks, and which template parses each.
 * Stored natively as JSON `{"packages": {"<package>": "<templateId>"}}`; falls back to [DEFAULTS].
 * Package names are best guesses; the owner should confirm them on a device.
 */
data class BankConfig(val packages: Map<String, String>) {
  fun templateFor(pkg: String): String? = packages[pkg]
  fun toJson(): String = JSONObject().put("packages", JSONObject(packages)).toString()

  companion object {
    val DEFAULTS = BankConfig(
      mapOf(
        "com.dbs.sg.dbsmbanking" to "dbs_posb", // DBS digibank / POSB
        "com.dbs.dbspaylah" to "paylah",        // PayLah!
        "com.ocbc.mobile" to "ocbc",
        "com.uob.mighty.app" to "uob",
      )
    )

    /** Null/blank/corrupt input yields [DEFAULTS]; an explicitly empty package map yields no banks. */
    fun parse(json: String?): BankConfig {
      if (json.isNullOrBlank()) return DEFAULTS
      return try {
        val p = JSONObject(json).getJSONObject("packages")
        BankConfig(p.keys().asSequence().associateWith { p.getString(it) })
      } catch (e: Exception) {
        DEFAULTS
      }
    }
  }
}
