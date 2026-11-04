package com.minibudget.quicklog

/** Minimal persistence seam so inbox logic runs on the plain JVM with an in-memory fake. */
interface InboxStorage {
  fun read(): String?
  fun write(value: String)
}

class InMemoryInboxStorage(private var value: String? = null) : InboxStorage {
  override fun read(): String? = value
  override fun write(value: String) { this.value = value }
}

/**
 * The native inbox. Native code (notification, tile, listeners) adds items here;
 * JS reads them with [getPending] and removes them with [ack] after saving them.
 */
class InboxStore(private val storage: InboxStorage) {
  @Synchronized
  fun getPending(): List<PendingTransaction> = PendingTransaction.listFromJson(storage.read())

  /** Adds an item; an item with the same id replaces the existing one. */
  @Synchronized
  fun add(item: PendingTransaction) {
    val next = getPending().filter { it.id != item.id } + item
    storage.write(PendingTransaction.listToJson(next))
  }

  @Synchronized
  fun update(id: String, transform: (PendingTransaction) -> PendingTransaction) {
    val next = getPending().map { if (it.id == id) transform(it) else it }
    storage.write(PendingTransaction.listToJson(next))
  }

  @Synchronized
  fun ack(ids: Collection<String>) {
    if (ids.isEmpty()) return
    val idSet = ids.toSet()
    storage.write(PendingTransaction.listToJson(getPending().filter { it.id !in idSet }))
  }
}
