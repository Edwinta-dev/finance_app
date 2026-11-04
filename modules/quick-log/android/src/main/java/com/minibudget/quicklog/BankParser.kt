package com.minibudget.quicklog

import com.minibudget.quicklog.templates.BankTemplate
import com.minibudget.quicklog.templates.DbsPosbTemplate
import com.minibudget.quicklog.templates.OcbcTemplate
import com.minibudget.quicklog.templates.ParsedBankTx
import com.minibudget.quicklog.templates.PayLahTemplate
import com.minibudget.quicklog.templates.UobTemplate

/** Turns a bank notification string into `{amount, merchant?, direction}`, or null. Plain JVM. */
object BankParser {
  val templates: Map<String, BankTemplate> = listOf(
    DbsPosbTemplate.template, OcbcTemplate.template, UobTemplate.template, PayLahTemplate.template,
  ).associateBy { it.id }

  fun parse(templateId: String, text: String?): ParsedBankTx? {
    if (text.isNullOrBlank()) return null
    return templates[templateId]?.parse(text)
  }
}
