package com.minibudget.quicklog

import org.json.JSONObject

data class MirrorAccount(val id: String, val name: String)

/** Read-only native copy of the user's categories and accounts (never balances or transactions). */
data class Mirror(
  val outflowCategories: List<String>,
  val inflowCategories: List<String>,
  val accounts: List<MirrorAccount>,
) {
  /** First [n] outflow categories in mirror order. */
  fun topCategories(n: Int): List<String> = outflowCategories.take(n.coerceAtLeast(0))

  companion object {
    val EMPTY = Mirror(emptyList(), emptyList(), emptyList())

    /** Lenient: null, blank or corrupt input yields [EMPTY]. */
    fun parse(json: String?): Mirror {
      if (json.isNullOrBlank()) return EMPTY
      return try {
        val o = JSONObject(json)
        Mirror(
          outflowCategories = strings(o, "outflowCategories"),
          inflowCategories = strings(o, "inflowCategories"),
          accounts = o.optJSONArray("accounts")?.let { arr ->
            (0 until arr.length()).mapNotNull { i ->
              val a = arr.optJSONObject(i) ?: return@mapNotNull null
              val id = a.optString("id")
              if (id.isEmpty()) null else MirrorAccount(id, a.optString("name", id))
            }
          } ?: emptyList(),
        )
      } catch (e: Exception) {
        EMPTY
      }
    }

    private fun strings(o: JSONObject, key: String): List<String> {
      val arr = o.optJSONArray(key) ?: return emptyList()
      return (0 until arr.length()).map { arr.optString(it) }.filter { it.isNotEmpty() }
    }
  }
}

class MirrorStore(private val storage: InboxStorage) {
  fun save(json: String) = storage.write(json)
  fun load(): Mirror = Mirror.parse(storage.read())
}
