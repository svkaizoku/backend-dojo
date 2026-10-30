import java.util.concurrent.ConcurrentHashMap

class RateLimiter(
    private val capacity: Int,
    private val refillPerSecond: Double,
    private val clock: () -> Long,
) {
    private class Bucket(var tokens: Double, var updatedAt: Long)

    private val buckets = ConcurrentHashMap<String, Bucket>()

    fun tryAcquire(key: String): Boolean {
        val bucket = buckets.computeIfAbsent(key) { Bucket(capacity.toDouble(), clock()) }
        synchronized(bucket) {
            val now = clock()
            val refill = (now - bucket.updatedAt) / 1000.0 * refillPerSecond
            bucket.tokens = minOf(capacity.toDouble(), bucket.tokens + refill)
            bucket.updatedAt = now
            if (bucket.tokens < 1.0) return false
            bucket.tokens -= 1.0
            return true
        }
    }
}
