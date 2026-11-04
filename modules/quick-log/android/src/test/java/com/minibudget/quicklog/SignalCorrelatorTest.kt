package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class SignalCorrelatorTest {
  private val bank = "com.example.bank"
  private val window = 60_000L
  private fun correlator(packages: Set<String> = setOf(bank)) = SignalCorrelator(packages, window)
  private fun cam(ts: Long) = SignalEvent(SignalType.CAMERA_USED, ts)
  private fun open(ts: Long, pkg: String? = bank) = SignalEvent(SignalType.BANK_APP_OPENED, ts, pkg)

  @Test fun bankOpenInsideWindowAfterCameraEmitsCandidate() {
    val c = correlator()
    assertNull(c.onEvent(cam(1_000)))
    val item = c.onEvent(open(30_000))!!
    assertEquals("unconfirmed", item.status)
    assertEquals("bank_camera", item.source)
    assertEquals(0.0, item.amount, 0.0)
    assertEquals(SignalCorrelator.CONFIDENCE, item.confidence, 0.0)
    assertEquals(30_000L, item.ts)
  }

  @Test fun windowBoundaryIsInclusive() {
    assertNotNull(correlator().also { it.onEvent(cam(0)) }.onEvent(open(window)))
    assertNull(correlator().also { it.onEvent(cam(0)) }.onEvent(open(window + 1)))
  }

  @Test fun bankOpenBeforeCameraDoesNotEmit() {
    val c = correlator()
    assertNull(c.onEvent(open(1_000)))
    assertNull(c.onEvent(cam(2_000)))
  }

  @Test fun bankOpenWithoutCameraDoesNotEmit() {
    assertNull(correlator().onEvent(open(1_000)))
  }

  @Test fun cameraPairsWithOnlyOneBankOpen() {
    val c = correlator()
    c.onEvent(cam(0))
    assertNotNull(c.onEvent(open(10_000)))
    assertNull(c.onEvent(open(20_000)))
  }

  @Test fun repeatedCameraCallbacksCountOnce() {
    val c = correlator()
    c.onEvent(cam(0)); c.onEvent(cam(500)); c.onEvent(cam(1_000))
    assertNotNull(c.onEvent(open(10_000)))
    assertNull(c.onEvent(open(11_000)))
  }

  @Test fun separateCameraUsesPairSeparately() {
    val c = correlator()
    c.onEvent(cam(0)); c.onEvent(cam(10_000))
    assertNotNull(c.onEvent(open(20_000)))
    assertNotNull(c.onEvent(open(25_000)))
    assertNull(c.onEvent(open(26_000)))
  }

  @Test fun emptyPackageListNeverEmits() {
    val c = correlator(emptySet())
    c.onEvent(cam(0))
    assertNull(c.onEvent(open(1_000)))
  }

  @Test fun nonBankAndNullPackagesAreIgnored() {
    val c = correlator()
    c.onEvent(cam(0))
    assertNull(c.onEvent(open(1_000, "com.example.game")))
    assertNull(c.onEvent(open(2_000, null)))
    assertNotNull(c.onEvent(open(3_000)))
  }

  @Test fun idsAreDeterministicPerOpen() {
    val a = correlator().also { it.onEvent(cam(0)) }.onEvent(open(5_000))!!
    val b = correlator().also { it.onEvent(cam(0)) }.onEvent(open(5_000))!!
    assertEquals(a.id, b.id)
  }
}
