import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

class RateLimiter {
    private final int capacity;
    private final double refillPerSecond;
    private final LongSupplier clock;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private static final class Bucket {
        double tokens;
        long updatedAt;

        Bucket(double tokens, long updatedAt) {
            this.tokens = tokens;
            this.updatedAt = updatedAt;
        }
    }

    RateLimiter(int capacity, double refillPerSecond, LongSupplier clock) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.clock = clock;
    }

    boolean tryAcquire(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(capacity, clock.getAsLong()));
        synchronized (bucket) {
            long now = clock.getAsLong();
            double refill = (now - bucket.updatedAt) / 1000.0 * refillPerSecond;
            bucket.tokens = Math.min(capacity, bucket.tokens + refill);
            bucket.updatedAt = now;
            if (bucket.tokens < 1.0) return false;
            bucket.tokens -= 1.0;
            return true;
        }
    }
}
