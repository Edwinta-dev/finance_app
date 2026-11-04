package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Test

class EchoTest {
  @Test
  fun echoPrefixesInput() {
    assertEquals("pong:quick-log", Echo.echo("quick-log"))
  }

  @Test
  fun echoHandlesEmptyInput() {
    assertEquals("pong:", Echo.echo(""))
  }
}
