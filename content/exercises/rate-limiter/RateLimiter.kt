/**
 * Token bucket rate limiter, one bucket per key.
 * - Each key starts with a full bucket of [capacity] tokens.
 * - Tokens refill continuously at [refillPerSecond], never above [capacity].
 * - tryAcquire takes one token and returns true, or returns false if none is left.
 * - [clock] returns the current time in milliseconds. It is injected so tests can control time.
 * - Calls can come from many threads at once.
 */
class RateLimiter(
    private val capacity: Int,
    private val refillPerSecond: Double,
    private val clock: () -> Long,
) {
    fun tryAcquire(key: String): Boolean {
        TODO("Implement the token bucket")
    }
}
