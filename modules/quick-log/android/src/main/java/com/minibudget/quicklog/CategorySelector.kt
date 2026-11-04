package com.minibudget.quicklog

/** Picks which categories get notification buttons. Plain JVM. */
object CategorySelector {
  /**
   * Top [n] categories: most recently used first (only ones still in the mirror),
   * then the rest in mirror order. [recentUse] is ordered most recent first and may repeat.
   */
  fun top(mirrorCategories: List<String>, recentUse: List<String>, n: Int = 3): List<String> {
    if (n <= 0) return emptyList()
    val known = mirrorCategories.toSet()
    val recent = recentUse.filter { it in known }.distinct()
    return (recent + mirrorCategories.filter { it !in recent }).distinct().take(n)
  }
}

/** Remembers recently used categories (most recent first) in an [InboxStorage]. */
class RecentCategories(private val storage: InboxStorage, private val max: Int = 20) {
  fun get(): List<String> {
    val raw = storage.read()
    if (raw.isNullOrBlank()) return emptyList()
    return try {
      val arr = org.json.JSONArray(raw)
      (0 until arr.length()).map { arr.getString(it) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  fun record(category: String) {
    val next = (listOf(category) + get().filter { it != category }).take(max)
    storage.write(org.json.JSONArray(next).toString())
  }
}
