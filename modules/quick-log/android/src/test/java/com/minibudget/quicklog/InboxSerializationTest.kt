package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class InboxSerializationTest {
  private fun tx(id: String, status: String = "confirmed") = PendingTransaction(
    id = id, amount = 12.5, direction = "outflow", category = "Food", memo = "lunch",
    source = "notification", ts = 1_700_000_000_000L, status = status,
  )

  @Test
  fun roundTripsAllFields() {
    val full = tx("a").copy(
      accountId = "acc1", confidence = 0.4, rawText = "invented text",
      location = PendingLocation(1.30, 103.80, 25.0, "Somewhere"),
    )
    val back = PendingTransaction.listFromJson(PendingTransaction.listToJson(listOf(full)))
    assertEquals(listOf(full), back)
  }

  @Test
  fun optionalFieldsStayNullWhenAbsent() {
    val back = PendingTransaction.listFromJson(PendingTransaction.listToJson(listOf(tx("a")))).single()
    assertNull(back.accountId)
    assertNull(back.rawText)
    assertNull(back.location)
  }

  @Test
  fun corruptOrEmptyJsonYieldsEmptyList() {
    assertTrue(PendingTransaction.listFromJson(null).isEmpty())
    assertTrue(PendingTransaction.listFromJson("").isEmpty())
    assertTrue(PendingTransaction.listFromJson("not json").isEmpty())
  }

  @Test
  fun malformedEntriesAreSkipped() {
    val json = """[{"id":"x"}, ${tx("ok").toJson()}]"""
    assertEquals(listOf("ok"), PendingTransaction.listFromJson(json).map { it.id })
  }

  @Test
  fun storeAddsAcksAndReplacesById() {
    val store = InboxStore(InMemoryInboxStorage())
    store.add(tx("a"))
    store.add(tx("b"))
    store.add(tx("a").copy(amount = 99.0))
    assertEquals(listOf("b", "a"), store.getPending().map { it.id })
    assertEquals(99.0, store.getPending().last().amount, 0.0)
    store.ack(listOf("a", "missing"))
    assertEquals(listOf("b"), store.getPending().map { it.id })
  }

  @Test
  fun storeUpdateChangesOnlyTargetItem() {
    val store = InboxStore(InMemoryInboxStorage())
    store.add(tx("a", "unconfirmed"))
    store.add(tx("b", "unconfirmed"))
    store.update("a") { it.copy(status = "confirmed") }
    assertEquals(listOf("confirmed", "unconfirmed"), store.getPending().map { it.status })
  }
}

class ClearUnconfirmedTest {
  private fun item(id: String, source: String, status: String) =
    PendingTransaction(id, 1.0, "outflow", "", source = source, ts = 1, status = status)

  @Test fun clearsOnlyUnconfirmedItemsFromTheGivenSources() {
    val store = InboxStore(InMemoryInboxStorage())
    store.add(item("a", "bank_notification", "unconfirmed"))
    store.add(item("b", "bank_notification", "confirmed"))
    store.add(item("c", "bank_camera", "unconfirmed"))
    store.add(item("d", "notification", "unconfirmed"))
    assertEquals(1, store.clearUnconfirmed(listOf("bank_notification")))
    assertEquals(listOf("b", "c", "d"), store.getPending().map { it.id })
    assertEquals(2, store.clearUnconfirmed(listOf("bank_camera", "notification")))
    assertEquals(listOf("b"), store.getPending().map { it.id })
  }

  @Test fun noMatchesOrEmptySourcesChangeNothing() {
    val store = InboxStore(InMemoryInboxStorage())
    store.add(item("a", "bank_notification", "unconfirmed"))
    assertEquals(0, store.clearUnconfirmed(emptyList()))
    assertEquals(0, store.clearUnconfirmed(listOf("other")))
    assertEquals(1, store.getPending().size)
  }
}
