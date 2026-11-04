package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NudgePolicyTest {
  private val min = 60_000L
  private val start = 1_000_000L
  private val end = start + 30_000L
  private val policy = NudgePolicy(5)

  @Test fun defaultsToFiveMinutesAndFixesBadValues() {
    assertEquals(5, NudgePolicy().nudgeMinutes)
    assertEquals(5, NudgePolicy(0).nudgeMinutes)
    assertEquals(5, NudgePolicy(-3).nudgeMinutes)
    assertEquals(10, NudgePolicy(10).nudgeMinutes)
  }

  @Test fun notDueBeforeTheDeadline() {
    assertFalse(policy.shouldNudge(start, end, emptyList(), end + 5 * min - 1))
  }

  @Test fun dueExactlyAtTheDeadlineWhenNothingWasLogged() {
    assertTrue(policy.shouldNudge(start, end, emptyList(), end + 5 * min))
  }

  @Test fun noNudgeWhenSomethingWasLoggedDuringOrShortlyAfterTheSession() {
    assertFalse(policy.shouldNudge(start, end, listOf(start + 1_000), end + 6 * min))
    assertFalse(policy.shouldNudge(start, end, listOf(end + 2 * min), end + 6 * min))
    assertFalse(policy.shouldNudge(start, end, listOf(end + 5 * min), end + 6 * min)) // boundary inclusive
  }

  @Test fun logsOutsideTheSessionRangeDoNotCount() {
    assertTrue(policy.shouldNudge(start, end, listOf(start - 1), end + 6 * min))
    assertTrue(policy.shouldNudge(start, end, listOf(end + 5 * min + 1), end + 6 * min))
  }

  @Test fun flickerAndInvalidSessionsAreIgnored() {
    assertFalse(policy.shouldNudge(start, start + 1_000, emptyList(), start + 10 * min))
    assertFalse(policy.shouldNudge(end, start, emptyList(), end + 10 * min))
  }

  @Test fun customMinutesMoveTheDeadline() {
    val p = NudgePolicy(1)
    assertEquals(end + min, p.dueAt(end))
    assertTrue(p.shouldNudge(start, end, emptyList(), end + min))
  }

  @Test fun logTimesKeepsSortedBoundedHistory() {
    val t = LogTimes(InMemoryInboxStorage(), max = 3)
    listOf(5L, 1L, 3L, 9L).forEach { t.record(it) }
    assertEquals(listOf(3L, 5L, 9L), t.all())
    assertTrue(LogTimes(InMemoryInboxStorage("garbage")).all().isEmpty())
  }

  @Test fun dailySummarySkipsZeroAndCountsOnlyUnconfirmed() {
    assertNull(DailySummary.text(0))
    assertNull(DailySummary.text(-1))
    assertEquals("1 payment is waiting for you to confirm.", DailySummary.text(1))
    assertEquals("3 payments are waiting for you to confirm.", DailySummary.text(3))
    val items = listOf("unconfirmed", "confirmed", "rejected", "unconfirmed").mapIndexed { i, s ->
      PendingTransaction("$i", 1.0, "outflow", "", source = "x", ts = 1, status = s)
    }
    assertEquals(2, DailySummary.unconfirmedCount(items))
  }
}
