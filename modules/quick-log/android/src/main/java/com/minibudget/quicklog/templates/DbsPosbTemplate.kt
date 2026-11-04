package com.minibudget.quicklog.templates

/** DBS digibank / POSB. Patterns are best-effort; verify against real notifications on a device. */
object DbsPosbTemplate {
  val template = BankTemplate(
    id = "dbs_posb",
    confidence = 0.9,
    outflow = listOf(
      Regex("transaction of ${BankTemplate.AMT}.*? at (?<merchant>[^.]+?)(?: on \\d|\\.|$)", BankTemplate.OPTIONS),
    ),
    inflow = listOf(
      Regex("received ${BankTemplate.AMT} from (?<merchant>[^.]+?)(?:\\.|$)", BankTemplate.OPTIONS),
    ),
  )
}
