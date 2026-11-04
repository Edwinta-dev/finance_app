package com.minibudget.quicklog

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.hardware.camera2.CameraManager
import android.os.Handler
import android.os.Looper
import android.os.Process

/**
 * Android glue for [SignalCorrelator]. Needs the user to grant Usage Access and to opt in.
 * Foreground-app detection polls UsageStatsManager; camera use comes from CameraManager.AvailabilityCallback.
 * No AccessibilityService is used.
 */
class UsageSignalMonitor(private val context: Context) {
  private val handler = Handler(Looper.getMainLooper())
  private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private val usage = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
  private val inbox = InboxStore(SharedPrefsInboxStorage(context, "pending"))
  private lateinit var correlator: SignalCorrelator
  private var lastPoll = 0L
  private var running = false

  private val cameraCallback = object : CameraManager.AvailabilityCallback() {
    override fun onCameraUnavailable(cameraId: String) {
      emit(correlator.onEvent(SignalEvent(SignalType.CAMERA_USED, System.currentTimeMillis())))
    }
  }

  private val poller = object : Runnable {
    override fun run() {
      if (!running) return
      pollForegroundApps()
      handler.postDelayed(this, POLL_MS)
    }
  }

  fun start() {
    if (running) return
    val config = BankConfig.parse(SharedPrefsInboxStorage(context, "bank_config").read())
    val window = SharedPrefsInboxStorage(context, "signal_window").read()?.toLongOrNull() ?: SignalCorrelator.DEFAULT_WINDOW_MS
    correlator = SignalCorrelator(config.packages.keys, window)
    lastPoll = System.currentTimeMillis()
    running = true
    cameraManager.registerAvailabilityCallback(cameraCallback, handler)
    handler.postDelayed(poller, POLL_MS)
  }

  fun stop() {
    running = false
    handler.removeCallbacks(poller)
    runCatching { cameraManager.unregisterAvailabilityCallback(cameraCallback) }
  }

  @Suppress("DEPRECATION")
  private fun pollForegroundApps() {
    val now = System.currentTimeMillis()
    val events = usage.queryEvents(lastPoll, now)
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
        emit(correlator.onEvent(SignalEvent(SignalType.BANK_APP_OPENED, e.timeStamp, e.packageName)))
      }
    }
    lastPoll = now
  }

  private fun emit(item: PendingTransaction?) {
    item ?: return
    inbox.add(item)
    CandidateNotifier.post(context, item)
  }

  companion object {
    const val POLL_MS = 5_000L

    fun hasUsageAccess(context: Context): Boolean {
      val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      @Suppress("DEPRECATION")
      val mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      return mode == AppOpsManager.MODE_ALLOWED
    }
  }
}
