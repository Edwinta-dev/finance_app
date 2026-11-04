package com.minibudget.quicklog

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class QuickLogModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("QuickLog")

    Function("ping") { Echo.echo("quick-log") }
  }
}
