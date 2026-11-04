package com.minibudget.quicklog

/** Plain-JVM helper (no Android types) so the stub module has logic that is unit testable. */
object Echo {
  fun echo(input: String): String = "pong:$input"
}
