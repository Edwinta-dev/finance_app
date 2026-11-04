package com.minibudget.quicklog

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SettingsTest {
  @Test fun defaultsToOff() {
    assertFalse(Settings(InMemoryInboxStorage()).isEnabled(Settings.NOTIFICATION_LOGGING))
  }

  @Test fun persistsIndependentFlags() {
    val storage = InMemoryInboxStorage()
    val s = Settings(storage)
    s.set("a", true); s.set("b", false); s.set("a", true)
    assertTrue(Settings(storage).isEnabled("a"))
    assertFalse(Settings(storage).isEnabled("b"))
    s.set("a", false)
    assertFalse(Settings(storage).isEnabled("a"))
  }

  @Test fun corruptStorageReadsAsOff() {
    val s = Settings(InMemoryInboxStorage("{{bad"))
    assertFalse(s.isEnabled("a"))
    s.set("a", true)
    assertTrue(s.isEnabled("a"))
  }
}
