package com.minibudget.quicklog

/**
 * Decides whether to nudge after a bank-app session ends. Plain JVM.
 * Rule: nudge once [nudgeMinutes] have passed since the session ended and nothing was logged
 * between the session start and that deadline.
 */
class NudgePolicy(nudgeMinutes: Int = DEFAULT_MINUTES) {
  val nudgeMinutes: Int = if (nudgeMinutes > 0) nudgeMinutes else DEFAULT_MINUTES

  fun dueAt(sessionEnd: Long): Long = sessionEnd + nudgeMinutes * 60_000L

  fun shouldNudge(sessionStart: Long, sessionEnd: Long, loggedAt: List<Long>, now: Long): Boolean {
    if (sessionEnd < sessionStart) return false
    if (sessionEnd - sessionStart < MIN_SESSION_MS) return false // ignore flickers
    if (now < dueAt(sessionEnd)) return false
    return loggedAt.none { it in sessionStart..dueAt(sessionEnd) }
  }

  companion object {
    const val DEFAULT_MINUTES = 5
    const val MIN_SESSION_MS = 3_000L
  }
}

/** Timestamps of transactions the user logged (any path), kept so nudges can tell if something was logged. */
class LogTimes(private val storage: InboxStorage, private val max: Int = 50) {
  fun all(): List<Long> {
    val raw = storage.read()
    if (raw.isNullOrBlank()) return emptyList()
    return try {
      val arr = org.json.JSONArray(raw)
      (0 until arr.length()).map { arr.getLong(it) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  fun record(ts: Long) {
    val next = (all() + ts).sorted().takeLast(max)
    storage.write(org.json.JSONArray(next).toString())
  }
}

/** Text of the once-a-day "N to review" notification, or null when there is nothing to say. */
object DailySummary {
  fun text(unconfirmedCount: Int): String? = when {
    unconfirmedCount <= 0 -> null
    unconfirmedCount == 1 -> "1 payment is waiting for you to confirm."
    else -> "$unconfirmedCount payments are waiting for you to confirm."
  }

  fun unconfirmedCount(items: List<PendingTransaction>): Int = items.count { it.status == "unconfirmed" }
}
