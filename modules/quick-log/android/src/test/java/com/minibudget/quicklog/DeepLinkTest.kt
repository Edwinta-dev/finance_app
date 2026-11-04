package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Test

class DeepLinkTest {
  @Test fun emptyLinkMatchesWhatTheAppParses() {
    assertEquals("minibudget://log?amount=&category=", DeepLink.log())
  }

  @Test fun encodesValues() {
    assertEquals("minibudget://log?amount=12.50&category=Eat%20%26%20Drink", DeepLink.log("12.50", "Eat & Drink"))
  }

  @Test fun notificationAndTileShareTheSameLink() {
    assertEquals(DeepLink.log(), NotificationPlan.DEEP_LINK)
  }
}
