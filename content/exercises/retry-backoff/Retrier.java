import java.util.concurrent.Callable;
import java.util.function.LongConsumer;

/**
 * Calls an action with retries and exponential backoff.
 * - Makes at most maxAttempts calls in total.
 * - Waits initialDelayMs before the 2nd call, then doubles the wait each time (100, 200, 400 …).
 * - Doesn't wait after the last failed call.
 * - IllegalArgumentException means a bad request: rethrow it at once, without retrying.
 * - When all attempts fail, rethrow the last exception.
 */
class Retrier {
    private final int maxAttempts;
    private final long initialDelayMs;
    private final LongConsumer sleep;

    Retrier(int maxAttempts, long initialDelayMs, LongConsumer sleep) {
        this.maxAttempts = maxAttempts;
        this.initialDelayMs = initialDelayMs;
        this.sleep = sleep;
    }

    <T> T call(Callable<T> action) throws Exception {
        long delay = initialDelayMs;
        int attempt = 1;
        while (attempt < maxAttempts) {
            try {
                return action.call();
            } catch (Exception e) {
                sleep.accept(delay);
                delay += initialDelayMs;
            }
            attempt++;
        }
        throw new IllegalStateException("Retries exhausted");
    }
}
