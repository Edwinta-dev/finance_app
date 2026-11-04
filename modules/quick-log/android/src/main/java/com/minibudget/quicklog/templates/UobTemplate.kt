package com.minibudget.quicklog.templates

/** UOB. Patterns are best-effort; verify against real notifications on a device. */
object UobTemplate {
  val template = BankTemplate(
    id = "uob",
    confidence = 0.85,
    outflow = listOf(
      Regex("transaction of ${BankTemplate.AMT} was made.*? at (?<merchant>[^.]+?)(?:\\.|$)", BankTemplate.OPTIONS),
    ),
    inflow = listOf(
      Regex("${BankTemplate.AMT} has been credited", BankTemplate.OPTIONS),
    ),
  )
}
