package com.minibudget.quicklog

import kotlin.math.cos
import kotlin.math.max
import kotlin.math.round

/** Snaps coordinates to a grid (default ~100 m) so stored places are less precise. Plain JVM. */
object LocationRounder {
  const val DEFAULT_GRID_METERS = 100.0
  private const val METERS_PER_DEGREE = 111_320.0

  fun round(lat: Double, lng: Double, gridMeters: Double = DEFAULT_GRID_METERS): Pair<Double, Double> {
    require(gridMeters > 0) { "gridMeters must be positive" }
    val latStep = gridMeters / METERS_PER_DEGREE
    val roundedLat = round(lat / latStep) * latStep
    // Longitude degrees shrink toward the poles. Use the *rounded* latitude for the step so nearby points
    // share one grid cell and rounding is idempotent. Clamp so the step stays finite at the poles.
    val lngStep = gridMeters / (METERS_PER_DEGREE * max(cos(Math.toRadians(roundedLat)), 1e-6))
    return Pair(roundedLat, round(lng / lngStep) * lngStep)
  }

  /** Returns the location snapped to the grid; accuracy is never reported better than the grid. */
  fun apply(location: PendingLocation, gridMeters: Double = DEFAULT_GRID_METERS): PendingLocation {
    val (lat, lng) = round(location.lat, location.lng, gridMeters)
    return location.copy(lat = lat, lng = lng, accuracy = max(location.accuracy ?: 0.0, gridMeters))
  }
}
