package com.minibudget.quicklog

/** What the ongoing notification shows. Pure data so it can be unit tested. */
data class NotificationPlan(
  val title: String,
  val text: String,
  val categoryActions: List<String>,
  val otherDeepLink: String,
) {
  companion object {
    val DEEP_LINK: String = DeepLink.log()

    fun build(mirror: Mirror, recentUse: List<String>, lastLogged: PendingTransaction? = null): NotificationPlan {
      val cats = CategorySelector.top(mirror.outflowCategories, recentUse, 3)
      val text = when {
        lastLogged != null -> "Logged %.2f · %s. Pick a category, type an amount.".format(lastLogged.amount, lastLogged.category)
        cats.isEmpty() -> "Open the app to set up categories."
        else -> "Pick a category, then type the amount."
      }
      return NotificationPlan("Quick log", text, cats, DEEP_LINK)
    }
  }
}
