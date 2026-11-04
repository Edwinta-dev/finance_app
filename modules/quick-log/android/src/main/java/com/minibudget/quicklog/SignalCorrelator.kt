package com.minibudget.quicklog

enum class SignalType { CAMERA_USED, BANK_APP_OPENED }

data class SignalEvent(val type: SignalType, val ts: Long, val packageName: String? = null)

/**
 * Weak hint: a bank app opened shortly after the camera was used (QR / PayNow at a stall).
 * Feed events in arrival order; [onEvent] returns a low-confidence, amount-less candidate when a
 * bank-app open follows a camera use within [windowMs]. Each camera use pairs with at most one bank open.
 * Plain JVM; no Android types.
 */
class SignalCorrelator(
  private val bankPackages: Set<String>,
  private val windowMs: Long = DEFAULT_WINDOW_MS,
) {
  private val cameraTimes = ArrayDeque<Long>()

  fun onEvent(event: SignalEvent): PendingTransaction? {
    // Anything older than the window can never pair again.
    while (cameraTimes.isNotEmpty() && event.ts - cameraTimes.first() > windowMs) cameraTimes.removeFirst()

    return when (event.type) {
      SignalType.CAMERA_USED -> {
        // Repeated callbacks for the same camera session collapse into one use.
        if (cameraTimes.lastOrNull()?.let { event.ts - it <= DEBOUNCE_MS } != true) cameraTimes.addLast(event.ts)
        null
      }
      SignalType.BANK_APP_OPENED -> {
        val pkg = event.packageName ?: return null
        if (pkg !in bankPackages) return null
        val camera = cameraTimes.lastOrNull { it <= event.ts && event.ts - it <= windowMs } ?: return null
        cameraTimes.remove(camera)
        PendingTransaction(
          id = "bankcam-$pkg-${event.ts}",
          amount = 0.0, // no amount is known; the user supplies it when confirming
          direction = "outflow",
          category = "",
          source = "bank_camera",
          confidence = CONFIDENCE,
          ts = event.ts,
          status = "unconfirmed",
        )
      }
    }
  }

  companion object {
    const val DEFAULT_WINDOW_MS = 2 * 60 * 1000L
    const val DEBOUNCE_MS = 2_000L
    const val CONFIDENCE = 0.3
  }
}
