package com.minibudget.quicklog

/** Parses what a user types into the notification amount box. Plain JVM. */
object AmountParser {
  private val PREFIX = Regex("^(?:s\\$|sgd|\\$)\\s*", RegexOption.IGNORE_CASE)
  private val PLAIN = Regex("^\\d+(\\.\\d{1,2})?$")
  private val THOUSANDS_DOT_DECIMAL = Regex("^\\d{1,3}(,\\d{3})+(\\.\\d{1,2})?$")
  private val COMMA_DECIMAL = Regex("^\\d+,\\d{1,2}$")
  private val THOUSANDS_ONLY = Regex("^\\d{1,3}(,\\d{3})+$")

  /** Accepts `12`, `12.5`, `$12.50`, `12,50`, `1,234.50`. Returns null for anything else, zero or negative. */
  fun parse(input: String?): Double? {
    if (input == null) return null
    var s = input.trim().replace(PREFIX, "").trim()
    if (s.isEmpty()) return null
    s = when {
      PLAIN.matches(s) -> s
      THOUSANDS_DOT_DECIMAL.matches(s) -> s.replace(",", "")
      COMMA_DECIMAL.matches(s) -> s.replace(',', '.')
      THOUSANDS_ONLY.matches(s) -> s.replace(",", "")
      else -> return null
    }
    val value = s.toDoubleOrNull() ?: return null
    if (value.isNaN() || value.isInfinite() || value <= 0.0) return null
    return value
  }
}
