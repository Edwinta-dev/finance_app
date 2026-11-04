package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

class LocationRounderTest {
  private fun meters(a: Pair<Double, Double>, b: Pair<Double, Double>): Double {
    val r = 6_371_000.0
    val dLat = Math.toRadians(b.first - a.first); val dLng = Math.toRadians(b.second - a.second)
    val h = sin(dLat / 2).pow(2) + cos(Math.toRadians(a.first)) * cos(Math.toRadians(b.first)) * sin(dLng / 2).pow(2)
    return 2 * r * asin(sqrt(h))
  }

  @Test fun movesPointByNoMoreThanAboutOneGridCell() {
    listOf(1.3521 to 103.8198, 51.5074 to -0.1278, -33.8688 to 151.2093, 64.1466 to -21.9426).forEach { p ->
      val out = LocationRounder.round(p.first, p.second)
      assertTrue("moved ${meters(p, out)} m at ${p.first}", meters(p, out) <= 100.0)
    }
  }

  @Test fun isIdempotent() {
    val once = LocationRounder.round(1.35214, 103.81987)
    val twice = LocationRounder.round(once.first, once.second)
    assertEquals(once.first, twice.first, 1e-9)
    assertEquals(once.second, twice.second, 1e-9)
  }

  @Test fun nearbyPointsCollapseAndFarOnesDoNot() {
    val a = LocationRounder.round(1.35210, 103.81980)
    val b = LocationRounder.round(1.35212, 103.81982) // ~3 m apart
    val far = LocationRounder.round(1.36210, 103.81980) // ~1.1 km north
    assertEquals(a, b)
    assertTrue(meters(a, far) > 500)
  }

  @Test fun coarserGridMovesFurther() {
    val p = 1.35214 to 103.81987
    val fine = LocationRounder.round(p.first, p.second, 10.0)
    val coarse = LocationRounder.round(p.first, p.second, 1000.0)
    assertTrue(meters(p, fine) <= meters(p, coarse) + 1e-6 || meters(p, coarse) <= 1000.0)
  }

  @Test fun handlesPolesAndInvalidGrid() {
    val pole = LocationRounder.round(90.0, 10.0)
    assertTrue(pole.first.isFinite() && pole.second.isFinite())
    var threw = false
    try { LocationRounder.round(1.0, 1.0, 0.0) } catch (e: IllegalArgumentException) { threw = true }
    assertTrue(threw)
  }

  @Test fun applyKeepsLabelAndNeverImprovesAccuracy() {
    val out = LocationRounder.apply(PendingLocation(1.35214, 103.81987, 20.0, "Somewhere"))
    assertEquals("Somewhere", out.placeLabel)
    assertEquals(100.0, out.accuracy!!, 0.0)
    assertEquals(250.0, LocationRounder.apply(PendingLocation(1.0, 1.0, 250.0)).accuracy!!, 0.0)
    assertEquals(100.0, LocationRounder.apply(PendingLocation(1.0, 1.0, null)).accuracy!!, 0.0)
  }
}
