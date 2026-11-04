package com.minibudget.quicklog.templates

/** OCBC. Patterns are best-effort; verify against real notifications on a device. */
object OcbcTemplate {
  val template = BankTemplate(
    id = "ocbc",
    confidence = 0.9,
    outflow = listOf(
      Regex("spent ${BankTemplate.AMT} at (?<merchant>.+?)(?: with| using|\\.|$)", BankTemplate.OPTIONS),
    ),
    inflow = listOf(
      Regex("received ${BankTemplate.AMT}(?: from (?<merchant>.+?))?(?:\\.|$)", BankTemplate.OPTIONS),
    ),
  )
}
