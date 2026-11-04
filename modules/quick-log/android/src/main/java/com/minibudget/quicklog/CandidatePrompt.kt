package com.minibudget.quicklog

import java.util.Locale

enum class PromptKind { CATEGORY, REJECT }

data class PromptAction(val label: String, val kind: PromptKind, val category: String? = null)

/** Text and buttons of the heads-up "is this yours?" notification. Plain JVM. */
data class CandidatePrompt(val title: String, val text: String, val actions: List<PromptAction>) {
  companion object {
    const val NOT_MINE = "Not mine"
    /** Android shows at most three action buttons: two categories plus "Not mine". The body tap opens the review list. */
    private const val CATEGORY_BUTTONS = 2

    fun build(item: PendingTransaction, mirror: Mirror, recentUse: List<String>): CandidatePrompt {
      val reject = PromptAction(NOT_MINE, PromptKind.REJECT)
      if (item.amount <= 0.0) {
        val place = item.memo.ifBlank { "" }
        return CandidatePrompt(
          title = "Did you just make a payment?",
          text = if (place.isEmpty()) "Open to add the amount." else "$place · open to add the amount.",
          actions = listOf(reject),
        )
      }
      val money = String.format(Locale.US, "SGD %.2f", item.amount)
      val who = item.memo.ifBlank { "this" }
      val inflow = item.direction == "inflow"
      val title = if (inflow) "$money received · $who?" else "$money · $who?"
      val categories =
        if (inflow) mirror.inflowCategories.take(CATEGORY_BUTTONS)
        else CategorySelector.top(mirror.outflowCategories, recentUse, CATEGORY_BUTTONS)
      return CandidatePrompt(
        title = title,
        text = "Tap a category to confirm, or open to review.",
        actions = categories.map { PromptAction(it, PromptKind.CATEGORY, it) } + reject,
      )
    }
  }
}

/** Applies a tapped prompt action to the inbox item. Plain JVM. */
object CandidateResolver {
  /** Returns true if the item was unconfirmed and has been resolved. */
  fun apply(inbox: InboxStore, id: String, action: PromptAction, location: PendingLocation? = null): Boolean {
    val current = inbox.getPending().firstOrNull { it.id == id } ?: return false
    if (current.status != "unconfirmed") return false
    return when (action.kind) {
      PromptKind.CATEGORY -> {
        val category = action.category ?: return false
        inbox.update(id) { it.copy(status = "confirmed", category = category, location = location ?: it.location) }
        true
      }
      PromptKind.REJECT -> {
        inbox.update(id) { it.copy(status = "rejected") }
        true
      }
    }
  }
}
