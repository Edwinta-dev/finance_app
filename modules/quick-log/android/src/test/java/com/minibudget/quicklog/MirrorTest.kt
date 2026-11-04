package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Test

class MirrorTest {
  private val json = """{"outflowCategories":["Food","Transport","Groceries","Health"],
    "inflowCategories":["Salary"],"accounts":[{"id":"1","name":"Main"},{"id":"2","name":"Savings"}]}"""

  @Test
  fun parsesPayload() {
    val m = Mirror.parse(json)
    assertEquals(4, m.outflowCategories.size)
    assertEquals(listOf("Salary"), m.inflowCategories)
    assertEquals(listOf(MirrorAccount("1", "Main"), MirrorAccount("2", "Savings")), m.accounts)
  }

  @Test
  fun topCategoriesKeepsMirrorOrderAndClamps() {
    val m = Mirror.parse(json)
    assertEquals(listOf("Food", "Transport", "Groceries"), m.topCategories(3))
    assertEquals(4, m.topCategories(10).size)
    assertEquals(emptyList<String>(), m.topCategories(0))
    assertEquals(emptyList<String>(), m.topCategories(-1))
  }

  @Test
  fun badInputYieldsEmptyMirror() {
    assertEquals(Mirror.EMPTY, Mirror.parse(null))
    assertEquals(Mirror.EMPTY, Mirror.parse(""))
    assertEquals(Mirror.EMPTY, Mirror.parse("{{nope"))
  }

  @Test
  fun skipsAccountsWithoutId() {
    val m = Mirror.parse("""{"accounts":[{"name":"x"},{"id":"9","name":"Ok"}]}""")
    assertEquals(listOf(MirrorAccount("9", "Ok")), m.accounts)
  }

  @Test
  fun storeRoundTrips() {
    val store = MirrorStore(InMemoryInboxStorage())
    assertEquals(Mirror.EMPTY, store.load())
    store.save(json)
    assertEquals("Food", store.load().topCategories(1).single())
  }
}
