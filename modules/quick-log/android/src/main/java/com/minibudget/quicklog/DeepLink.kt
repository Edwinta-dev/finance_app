package com.minibudget.quicklog

import java.net.URLEncoder

/** Builds the `minibudget://log` link that opens the in-app log screen. Shared by the notification and the tile. */
object DeepLink {
  const val SCHEME = "minibudget"

  fun log(amount: String = "", category: String = ""): String =
    "$SCHEME://log?amount=${enc(amount)}&category=${enc(category)}"

  private fun enc(s: String) = URLEncoder.encode(s, "UTF-8").replace("+", "%20")
}
