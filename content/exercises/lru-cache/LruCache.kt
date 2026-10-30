/**
 * Least-recently-used cache with a fixed capacity.
 * - get returns the value or null, and counts as a use.
 * - put adds or updates a value, and counts as a use.
 * - When a put would go over capacity, the least recently used entry is removed.
 * - capacity must be at least 1, otherwise throw IllegalArgumentException.
 * - get and put should be O(1).
 */
class LruCache<K, V>(private val capacity: Int) {

    fun get(key: K): V? {
        TODO("Implement get")
    }

    fun put(key: K, value: V) {
        TODO("Implement put")
    }

    val size: Int
        get() = TODO("Implement size")
}
