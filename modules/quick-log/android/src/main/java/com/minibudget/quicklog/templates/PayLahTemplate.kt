package com.minibudget.quicklog.templates

/** DBS PayLah!. Patterns are best-effort; verify against real notifications on a device. */
object PayLahTemplate {
  val template = BankTemplate(
    id = "paylah",
    confidence = 0.9,
    outflow = listOf(
      Regex("paid ${BankTemplate.AMT} to (?<merchant>.+?)(?: via|!|\\.|$)", BankTemplate.OPTIONS),
    ),
    inflow = listOf(
      Regex("received ${BankTemplate.AMT} from (?<merchant>.+?)(?: via|!|\\.|$)", BankTemplate.OPTIONS),
    ),
  )
}
