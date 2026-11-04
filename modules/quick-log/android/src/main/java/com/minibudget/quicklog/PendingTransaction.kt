package com.minibudget.quicklog

import org.json.JSONArray
import org.json.JSONObject

data class PendingLocation(
  val lat: Double,
  val lng: Double,
  val accuracy: Double? = null,
  val placeLabel: String? = null,
) {
  fun toJson(): JSONObject = JSONObject().apply {
    put("lat", lat)
    put("lng", lng)
    accuracy?.let { put("accuracy", it) }
    placeLabel?.let { put("placeLabel", it) }
  }

  companion object {
    fun fromJson(o: JSONObject) = PendingLocation(
      lat = o.getDouble("lat"),
      lng = o.getDouble("lng"),
      accuracy = if (o.has("accuracy") && !o.isNull("accuracy")) o.getDouble("accuracy") else null,
      placeLabel = o.optString("placeLabel").ifEmpty { null },
    )
  }
}

/** Plain-JVM model of an item waiting in the native inbox. No Android types. */
data class PendingTransaction(
  val id: String,
  val amount: Double,
  val direction: String, // "inflow" | "outflow"
  val category: String,
  val accountId: String? = null,
  val memo: String = "",
  val source: String,
  val confidence: Double = 1.0,
  val rawText: String? = null,
  val location: PendingLocation? = null,
  val ts: Long,
  val status: String, // "confirmed" | "unconfirmed" | "rejected"
) {
  fun toJson(): JSONObject = JSONObject().apply {
    put("id", id)
    put("amount", amount)
    put("direction", direction)
    put("category", category)
    accountId?.let { put("accountId", it) }
    put("memo", memo)
    put("source", source)
    put("confidence", confidence)
    rawText?.let { put("rawText", it) }
    location?.let { put("location", it.toJson()) }
    put("ts", ts)
    put("status", status)
  }

  companion object {
    fun fromJson(o: JSONObject) = PendingTransaction(
      id = o.getString("id"),
      amount = o.getDouble("amount"),
      direction = o.getString("direction"),
      category = o.optString("category", ""),
      accountId = o.optString("accountId").ifEmpty { null },
      memo = o.optString("memo", ""),
      source = o.getString("source"),
      confidence = o.optDouble("confidence", 1.0),
      rawText = o.optString("rawText").ifEmpty { null },
      location = o.optJSONObject("location")?.let { PendingLocation.fromJson(it) },
      ts = o.getLong("ts"),
      status = o.getString("status"),
    )

    fun listToJson(items: List<PendingTransaction>): String {
      val arr = JSONArray()
      items.forEach { arr.put(it.toJson()) }
      return arr.toString()
    }

    /** Lenient: corrupt or empty input yields an empty list, malformed entries are skipped. */
    fun listFromJson(json: String?): List<PendingTransaction> {
      if (json.isNullOrBlank()) return emptyList()
      return try {
        val arr = JSONArray(json)
        (0 until arr.length()).mapNotNull { i ->
          try { fromJson(arr.getJSONObject(i)) } catch (e: Exception) { null }
        }
      } catch (e: Exception) {
        emptyList()
      }
    }
  }
}
