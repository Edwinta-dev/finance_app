package com.minibudget.quicklog

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import java.util.Locale
import java.util.concurrent.Executors

/**
 * One-shot location at balanced accuracy, only when the user opted in. No background location.
 * Rounding and reverse geocoding are separate opt-ins; geocoding is the only step that may use the network.
 */
object LocationCapture {
  private val io = Executors.newSingleThreadExecutor()

  fun hasPermission(context: Context): Boolean =
    context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
      context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

  /** Calls [onResult] once with the location, or null if disabled, not permitted or unavailable. */
  fun capture(context: Context, onResult: (PendingLocation?) -> Unit) {
    val settings = Settings(SharedPrefsInboxStorage(context, "settings"))
    if (!settings.isEnabled(Settings.LOCATION_CAPTURE) || !hasPermission(context)) return onResult(null)

    try {
      val client = LocationServices.getFusedLocationProviderClient(context)
      client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, CancellationTokenSource().token)
        .addOnSuccessListener { loc ->
          if (loc == null) return@addOnSuccessListener onResult(null)
          var result = PendingLocation(loc.latitude, loc.longitude, loc.accuracy.toDouble())
          if (settings.isEnabled(Settings.ROUND_LOCATION)) result = LocationRounder.apply(result)
          if (settings.isEnabled(Settings.REVERSE_GEOCODING)) {
            io.execute { onResult(result.copy(placeLabel = label(context, result))) }
          } else {
            onResult(result)
          }
        }
        .addOnFailureListener { onResult(null) }
    } catch (e: SecurityException) {
      onResult(null)
    }
  }

  @Suppress("DEPRECATION")
  private fun label(context: Context, loc: PendingLocation): String? = try {
    Geocoder(context, Locale.getDefault()).getFromLocation(loc.lat, loc.lng, 1)?.firstOrNull()?.let {
      it.featureName ?: it.thoroughfare ?: it.locality
    }
  } catch (e: Exception) {
    null
  }
}
