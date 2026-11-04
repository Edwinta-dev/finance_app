package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class QuickLoggerTest {
  private fun setup(): Triple<QuickLogger, InboxStore, RecentCategories> {
    val inbox = InboxStore(InMemoryInboxStorage())
    val recent = RecentCategories(InMemoryInboxStorage())
    var n = 0
    return Triple(QuickLogger(inbox, recent, now = { 1000L }, newId = { "id${n++}" }), inbox, recent)
  }

  @Test fun validAmountWritesConfirmedNotificationItem() {
    val (logger, inbox, recent) = setup()
    val ok = logger.log("12,50", "Food") as LogResult.Logged
    assertEquals(12.5, ok.item.amount, 0.0)
    val stored = inbox.getPending().single()
    assertEquals("notification", stored.source)
    assertEquals("confirmed", stored.status)
    assertEquals("outflow", stored.direction)
    assertEquals("Food", stored.category)
    assertEquals(1000L, stored.ts)
    assertEquals(listOf("Food"), recent.get())
  }

  @Test fun invalidAmountWritesNothing() {
    val (logger, inbox, recent) = setup()
    assertTrue(logger.log("", "Food") is LogResult.InvalidAmount)
    assertTrue(logger.log("-3", "Food") is LogResult.InvalidAmount)
    assertTrue(inbox.getPending().isEmpty())
    assertTrue(recent.get().isEmpty())
  }

  @Test fun eachLogGetsItsOwnId() {
    val (logger, inbox, _) = setup()
    logger.log("1", "Food"); logger.log("1", "Food")
    assertEquals(listOf("id0", "id1"), inbox.getPending().map { it.id })
  }

  @Test fun planUsesRecentCategoriesAndLastLogged() {
    val mirror = Mirror(listOf("Food", "Transport", "Health", "Other"), emptyList(), emptyList())
    val plan = NotificationPlan.build(mirror, listOf("Health"))
    assertEquals(listOf("Health", "Food", "Transport"), plan.categoryActions)
    assertTrue(plan.otherDeepLink.startsWith("minibudget://log?"))
    val after = NotificationPlan.build(mirror, listOf("Food"), PendingTransaction("x", 5.0, "outflow", "Food", source = "notification", ts = 1, status = "confirmed"))
    assertTrue(after.text.contains("5.00"))
    assertEquals("Open the app to set up categories.", NotificationPlan.build(Mirror.EMPTY, emptyList()).text)
  }
}
