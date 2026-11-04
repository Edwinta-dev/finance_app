package com.minibudget.quicklog

/** Decides what to do with a posted notification. Plain JVM so the gating rules are testable. */
class BankNotificationHandler(
  private val settings: Settings,
  private val config: () -> BankConfig,
  private val inbox: InboxStore,
) {
  /** Returns the inbox item written, or null if ignored (opt-out, other package, no match). */
  fun handle(packageName: String, text: String?, postTime: Long): PendingTransaction? {
    if (!settings.isEnabled(Settings.BANK_NOTIFICATIONS)) return null
    val templateId = config().templateFor(packageName) ?: return null
    val body = text ?: return null
    val parsed = BankParser.parse(templateId, body) ?: return null

    val item = PendingTransaction(
      id = "bank-$packageName-$postTime-${body.hashCode()}", // re-posts of the same notification collapse
      amount = parsed.amount,
      direction = parsed.direction,
      category = "",
      memo = parsed.merchant.orEmpty(),
      source = "bank_notification",
      confidence = parsed.confidence,
      rawText = if (settings.isEnabled(Settings.KEEP_RAW_TEXT)) body else null,
      ts = postTime,
      status = "unconfirmed",
    )
    inbox.add(item)
    return item
  }
}
