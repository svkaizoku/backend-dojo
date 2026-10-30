import java.util.function.LongSupplier;

/**
 * Token bucket rate limiter, one bucket per key.
 * - Each key starts with a full bucket of capacity tokens.
 * - Tokens refill continuously at refillPerSecond, never above capacity.
 * - tryAcquire takes one token and returns true, or returns false if none is left.
 * - clock returns the current time in milliseconds. It is injected so tests can control time.
 * - Calls can come from many threads at once.
 */
class RateLimiter {
    private final int capacity;
    private final double refillPerSecond;
    private final LongSupplier clock;

    RateLimiter(int capacity, double refillPerSecond, LongSupplier clock) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.clock = clock;
    }

    boolean tryAcquire(String key) {
        throw new UnsupportedOperationException("TODO: implement the token bucket");
    }
}
