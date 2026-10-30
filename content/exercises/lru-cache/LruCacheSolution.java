import java.util.LinkedHashMap;
import java.util.Map;

class LruCache<K, V> {
    private final Map<K, V> map;

    LruCache(int capacity) {
        if (capacity < 1) throw new IllegalArgumentException("capacity must be at least 1");
        // accessOrder = true makes iteration order "least recently used first".
        this.map = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    V get(K key) {
        return map.get(key);
    }

    void put(K key, V value) {
        map.put(key, value);
    }

    int size() {
        return map.size();
    }
}
