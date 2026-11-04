package com.minibudget.quicklog.templates

data class ParsedBankTx(
  val amount: Double,
  val merchant: String?,
  val direction: String, // "inflow" | "outflow"
  val confidence: Double,
)

/** A per-bank set of patterns. Plain JVM. */
class BankTemplate(
  val id: String,
  val confidence: Double,
  private val outflow: List<Regex>,
  private val inflow: List<Regex>,
) {
  fun parse(text: String): ParsedBankTx? {
    for ((direction, patterns) in listOf("outflow" to outflow, "inflow" to inflow)) {
      for (p in patterns) {
        val m = p.find(text) ?: continue
        val amount = m.groups["amt"]?.value?.replace(",", "")?.toDoubleOrNull() ?: continue
        if (amount <= 0.0) continue
        val merchant = try { m.groups["merchant"]?.value?.trim()?.ifEmpty { null } } catch (e: Exception) { null }
        return ParsedBankTx(amount, merchant, direction, confidence)
      }
    }
    return null
  }

  companion object {
    /** `SGD 12.50`, `SGD12.50`, `S$12.50`; captured as group `amt`. */
    const val AMT = "(?:SGD|S\\$)\\s?(?<amt>\\d[\\d,]*(?:\\.\\d{1,2})?)"
    val OPTIONS = setOf(RegexOption.IGNORE_CASE)
  }
}
