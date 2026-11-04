package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Test

class CategorySelectorTest {
  private val mirror = listOf("Food", "Transport", "Groceries", "Utilities", "Health")

  @Test fun fallsBackToMirrorOrderWithNoHistory() {
    assertEquals(listOf("Food", "Transport", "Groceries"), CategorySelector.top(mirror, emptyList()))
  }

  @Test fun recentUseComesFirstThenMirrorOrder() {
    assertEquals(listOf("Health", "Utilities", "Food"), CategorySelector.top(mirror, listOf("Health", "Utilities")))
  }

  @Test fun repeatedAndUnknownRecentEntriesAreHandled() {
    assertEquals(listOf("Transport", "Food", "Groceries"), CategorySelector.top(mirror, listOf("Transport", "Gone", "Transport")))
  }

  @Test fun smallMirrorReturnsWhatExists() {
    assertEquals(listOf("A"), CategorySelector.top(listOf("A"), emptyList()))
    assertEquals(emptyList<String>(), CategorySelector.top(emptyList(), listOf("A")))
    assertEquals(emptyList<String>(), CategorySelector.top(mirror, emptyList(), 0))
  }

  @Test fun recentCategoriesAreMostRecentFirstAndCapped() {
    val r = RecentCategories(InMemoryInboxStorage(), max = 3)
    listOf("A", "B", "C", "A", "D").forEach { r.record(it) }
    assertEquals(listOf("D", "A", "C"), r.get())
  }

  @Test fun recentCategoriesToleratesCorruptStorage() {
    assertEquals(emptyList<String>(), RecentCategories(InMemoryInboxStorage("garbage")).get())
  }
}
