package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** All strings are invented fixtures: no real merchants, cards or accounts. */
class BankParserTest {
  @Test fun dbsPosbOutflowWithMerchant() {
    val r = BankParser.parse("dbs_posb", "Card Transaction: A transaction of SGD 12.50 was made with your card ending 0000 at EXAMPLE CAFE on 05 JAN.")!!
    assertEquals(12.5, r.amount, 0.0)
    assertEquals("EXAMPLE CAFE", r.merchant)
    assertEquals("outflow", r.direction)
    assertEquals(0.9, r.confidence, 0.0)
  }

  @Test fun dbsPosbInflow() {
    val r = BankParser.parse("dbs_posb", "PayNow: You have received SGD 1,030.00 from TEST PERSON.")!!
    assertEquals(1030.0, r.amount, 0.0)
    assertEquals("inflow", r.direction)
    assertEquals("TEST PERSON", r.merchant)
  }

  @Test fun ocbcOutflowAndInflow() {
    val out = BankParser.parse("ocbc", "OCBC: You spent SGD 8.90 at SAMPLE KOPI with your card ending 0000.")!!
    assertEquals(8.9, out.amount, 0.0)
    assertEquals("SAMPLE KOPI", out.merchant)
    val inn = BankParser.parse("ocbc", "OCBC: You received SGD 20.00.")!!
    assertEquals("inflow", inn.direction)
    assertNull(inn.merchant)
  }

  @Test fun uobOutflowAndInflow() {
    val out = BankParser.parse("uob", "UOB: A transaction of SGD8.90 was made on your card ending 0000 at SAMPLE KOPI.")!!
    assertEquals(8.9, out.amount, 0.0)
    assertEquals("SAMPLE KOPI", out.merchant)
    assertEquals(0.85, out.confidence, 0.0)
    val inn = BankParser.parse("uob", "UOB: SGD 50.00 has been credited to your account ending 0000.")!!
    assertEquals("inflow", inn.direction)
    assertEquals(50.0, inn.amount, 0.0)
  }

  @Test fun payLahPaidAndReceived() {
    val paid = BankParser.parse("paylah", "You have paid S\$4.20 to SAMPLE STALL via PayLah!")!!
    assertEquals(4.2, paid.amount, 0.0)
    assertEquals("SAMPLE STALL", paid.merchant)
    assertEquals("outflow", paid.direction)
    val got = BankParser.parse("paylah", "You have received SGD 10.00 from TEST FRIEND via PayLah!")!!
    assertEquals("inflow", got.direction)
    assertEquals("TEST FRIEND", got.merchant)
  }

  @Test fun nonMatchingStringsReturnNull() {
    listOf(
      "Your OTP is 123456", "Promo: get 5% cashback this weekend", "Statement is ready",
      "You have paid to SAMPLE STALL via PayLah!", "Card Transaction: no amount here",
    ).forEach { assertNull(it, BankParser.parse("paylah", it)); assertNull(it, BankParser.parse("dbs_posb", it)) }
  }

  @Test fun malformedStringsReturnNull() {
    assertNull(BankParser.parse("dbs_posb", null))
    assertNull(BankParser.parse("dbs_posb", ""))
    assertNull(BankParser.parse("dbs_posb", "   "))
    assertNull(BankParser.parse("dbs_posb", "A transaction of SGD abc was made at X."))
    assertNull(BankParser.parse("dbs_posb", "A transaction of SGD 0.00 was made at X."))
    assertNull(BankParser.parse("no_such_template", "A transaction of SGD 1.00 was made at X."))
  }

  @Test fun everyTemplateIsRegistered() {
    assertEquals(setOf("dbs_posb", "ocbc", "uob", "paylah"), BankParser.templates.keys)
  }
}

class BankNotificationHandlerTest {
  private val text = "OCBC: You spent SGD 8.90 at SAMPLE KOPI with your card ending 0000."
  private fun setup(vararg on: String): Triple<BankNotificationHandler, InboxStore, Settings> {
    val settings = Settings(InMemoryInboxStorage())
    on.forEach { settings.set(it, true) }
    val inbox = InboxStore(InMemoryInboxStorage())
    return Triple(BankNotificationHandler(settings, { BankConfig.DEFAULTS }, inbox), inbox, settings)
  }

  @Test fun disabledByDefault() {
    val (h, inbox, _) = setup()
    assertNull(h.handle("com.ocbc.mobile", text, 1L))
    assertTrue(inbox.getPending().isEmpty())
  }

  @Test fun ignoresOtherPackages() {
    val (h, inbox, _) = setup(Settings.BANK_NOTIFICATIONS)
    assertNull(h.handle("com.example.chat", text, 1L))
    assertTrue(inbox.getPending().isEmpty())
  }

  @Test fun matchBecomesUnconfirmedCandidateWithoutRawText() {
    val (h, inbox, _) = setup(Settings.BANK_NOTIFICATIONS)
    val item = h.handle("com.ocbc.mobile", text, 5L)!!
    val stored = inbox.getPending().single()
    assertEquals(item, stored)
    assertEquals("unconfirmed", stored.status)
    assertEquals("bank_notification", stored.source)
    assertEquals(0.9, stored.confidence, 0.0)
    assertEquals("SAMPLE KOPI", stored.memo)
    assertNull(stored.rawText)
  }

  @Test fun rawTextOnlyWithSeparateOptIn() {
    val (h, inbox, _) = setup(Settings.BANK_NOTIFICATIONS, Settings.KEEP_RAW_TEXT)
    h.handle("com.ocbc.mobile", text, 5L)
    assertEquals(text, inbox.getPending().single().rawText)
  }

  @Test fun repostedNotificationCollapsesToOneItem() {
    val (h, inbox, _) = setup(Settings.BANK_NOTIFICATIONS)
    h.handle("com.ocbc.mobile", text, 5L); h.handle("com.ocbc.mobile", text, 5L)
    assertEquals(1, inbox.getPending().size)
  }

  @Test fun nonMatchingTextIsIgnored() {
    val (h, inbox, _) = setup(Settings.BANK_NOTIFICATIONS)
    assertNull(h.handle("com.ocbc.mobile", "Your OTP is 123456", 1L))
    assertNull(h.handle("com.ocbc.mobile", null, 1L))
    assertTrue(inbox.getPending().isEmpty())
  }

  @Test fun emptyPackageListIgnoresEverything() {
    val settings = Settings(InMemoryInboxStorage()).also { it.set(Settings.BANK_NOTIFICATIONS, true) }
    val inbox = InboxStore(InMemoryInboxStorage())
    val h = BankNotificationHandler(settings, { BankConfig.parse("""{"packages":{}}""") }, inbox)
    assertNull(h.handle("com.ocbc.mobile", text, 1L))
  }

  @Test fun configParsesDefaultsAndOverrides() {
    assertEquals(BankConfig.DEFAULTS, BankConfig.parse(null))
    assertEquals(BankConfig.DEFAULTS, BankConfig.parse("garbage"))
    val c = BankConfig.parse(BankConfig(mapOf("x.y" to "uob")).toJson())
    assertEquals("uob", c.templateFor("x.y"))
    assertNull(c.templateFor("com.ocbc.mobile"))
    assertNotNull(BankConfig.DEFAULTS.templateFor("com.dbs.dbspaylah"))
    assertFalse(BankConfig.DEFAULTS.packages.isEmpty())
  }
}
