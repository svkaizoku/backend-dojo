/**
 * Least-recently-used cache with a fixed capacity.
 * - get returns the value or null, and counts as a use.
 * - put adds or updates a value, and counts as a use.
 * - When a put would go over capacity, the least recently used entry is removed.
 * - capacity must be at least 1, otherwise throw IllegalArgumentException.
 * - get and put should be O(1).
 */
class LruCache<K, V> {

    LruCache(int capacity) {
    }

    V get(K key) {
        throw new UnsupportedOperationException("TODO: implement get");
    }

    void put(K key, V value) {
        throw new UnsupportedOperationException("TODO: implement put");
    }

    int size() {
        throw new UnsupportedOperationException("TODO: implement size");
    }
}
