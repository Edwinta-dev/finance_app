package com.minibudget.quicklog

import java.util.UUID

sealed class LogResult {
  data class Logged(val item: PendingTransaction) : LogResult()
  object InvalidAmount : LogResult()
}

/** Turns a notification action into an inbox item. Plain JVM; clock and id source are injectable. */
class QuickLogger(
  private val inbox: InboxStore,
  private val recent: RecentCategories,
  private val now: () -> Long = { System.currentTimeMillis() },
  private val newId: () -> String = { UUID.randomUUID().toString() },
) {
  fun log(amountText: String?, category: String): LogResult {
    val amount = AmountParser.parse(amountText) ?: return LogResult.InvalidAmount
    val item = PendingTransaction(
      id = newId(),
      amount = amount,
      direction = "outflow",
      category = category,
      memo = "",
      source = "notification",
      confidence = 1.0,
      ts = now(),
      status = "confirmed",
    )
    inbox.add(item)
    recent.record(category)
    return LogResult.Logged(item)
  }
}
