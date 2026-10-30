class LruCache<K, V>(private val capacity: Int) {
    init {
        require(capacity >= 1) { "capacity must be at least 1" }
    }

    // accessOrder = true makes iteration order "least recently used first".
    private val map = object : LinkedHashMap<K, V>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<K, V>?) = size > capacity
    }

    fun get(key: K): V? = map[key]

    fun put(key: K, value: V) {
        map[key] = value
    }

    val size: Int
        get() = map.size
}
