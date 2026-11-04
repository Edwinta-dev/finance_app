package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CandidatePromptTest {
  private val mirror = Mirror(listOf("Food", "Transport", "Groceries"), listOf("Salary", "Reimbursement", "Other"), emptyList())
  private fun item(over: (PendingTransaction) -> PendingTransaction = { it }) = over(
    PendingTransaction("c1", 12.0, "outflow", "", memo = "Kopitiam", source = "bank_notification", ts = 1, status = "unconfirmed")
  )

  @Test fun titleShowsAmountAndMerchant() {
    assertEquals("SGD 12.00 · Kopitiam?", CandidatePrompt.build(item(), mirror, emptyList()).title)
  }

  @Test fun actionsAreTwoCategoriesPlusNotMine() {
    val p = CandidatePrompt.build(item(), mirror, listOf("Transport"))
    assertEquals(listOf("Transport", "Food", CandidatePrompt.NOT_MINE), p.actions.map { it.label })
    assertEquals(PromptKind.REJECT, p.actions.last().kind)
    assertTrue(p.actions.size <= 3)
  }

  @Test fun inflowUsesInflowCategories() {
    val p = CandidatePrompt.build(item { it.copy(direction = "inflow", memo = "TEST PERSON") }, mirror, emptyList())
    assertEquals("SGD 12.00 received · TEST PERSON?", p.title)
    assertEquals(listOf("Salary", "Reimbursement", CandidatePrompt.NOT_MINE), p.actions.map { it.label })
  }

  @Test fun missingMerchantFallsBack() {
    assertEquals("SGD 12.00 · this?", CandidatePrompt.build(item { it.copy(memo = "") }, mirror, emptyList()).title)
  }

  @Test fun amountLessHintOnlyOffersNotMine() {
    val p = CandidatePrompt.build(item { it.copy(amount = 0.0, source = "bank_camera") }, mirror, emptyList())
    assertEquals(listOf(CandidatePrompt.NOT_MINE), p.actions.map { it.label })
    assertFalse(p.title.contains("SGD"))
  }

  @Test fun categoryActionConfirmsWithThatCategory() {
    val inbox = InboxStore(InMemoryInboxStorage()); inbox.add(item())
    assertTrue(CandidateResolver.apply(inbox, "c1", PromptAction("Food", PromptKind.CATEGORY, "Food")))
    val s = inbox.getPending().single()
    assertEquals("confirmed", s.status); assertEquals("Food", s.category)
  }

  @Test fun notMineRejects() {
    val inbox = InboxStore(InMemoryInboxStorage()); inbox.add(item())
    assertTrue(CandidateResolver.apply(inbox, "c1", PromptAction("Not mine", PromptKind.REJECT)))
    assertEquals("rejected", inbox.getPending().single().status)
  }

  @Test fun alreadyResolvedOrMissingItemsAreLeftAlone() {
    val inbox = InboxStore(InMemoryInboxStorage()); inbox.add(item { it.copy(status = "confirmed", category = "Food") })
    assertFalse(CandidateResolver.apply(inbox, "c1", PromptAction("Not mine", PromptKind.REJECT)))
    assertFalse(CandidateResolver.apply(inbox, "nope", PromptAction("Not mine", PromptKind.REJECT)))
    assertEquals("confirmed", inbox.getPending().single().status)
  }
}
