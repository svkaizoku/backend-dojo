import java.util.concurrent.Callable;
import java.util.function.LongConsumer;

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
        for (int attempt = 1; ; attempt++) {
            try {
                return action.call();
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                if (attempt >= maxAttempts) throw e;
                sleep.accept(delay);
                delay *= 2;
            }
        }
    }
}
