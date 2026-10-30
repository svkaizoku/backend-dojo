public class Main {
    public static void main(String[] args) {
        test("allows a burst up to capacity", () -> {
            RateLimiter limiter = new RateLimiter(3, 1.0, () -> 0L);
            for (int i = 1; i <= 3; i++) check(limiter.tryAcquire("u1"), "call " + i + " of 3 was rejected");
            check(!limiter.tryAcquire("u1"), "4th call was allowed");
        });
        test("refills over time", () -> {
            long[] now = {0};
            RateLimiter limiter = new RateLimiter(2, 1.0, () -> now[0]);
            limiter.tryAcquire("u1");
            limiter.tryAcquire("u1");
            now[0] = 500;
            check(!limiter.tryAcquire("u1"), "allowed after only half a token refilled");
            now[0] = 1_000;
            check(limiter.tryAcquire("u1"), "rejected after a full token refilled");
            check(!limiter.tryAcquire("u1"), "allowed a second call with only one token refilled");
        });
        test("never refills above capacity", () -> {
            long[] now = {0};
            RateLimiter limiter = new RateLimiter(2, 1.0, () -> now[0]);
            now[0] = 60_000;
            for (int i = 1; i <= 2; i++) check(limiter.tryAcquire("u1"), "call " + i + " of 2 was rejected");
            check(!limiter.tryAcquire("u1"), "allowed more than capacity after a long idle period");
        });
        test("keys are independent", () -> {
            RateLimiter limiter = new RateLimiter(1, 1.0, () -> 0L);
            check(limiter.tryAcquire("a"), "first call for a was rejected");
            check(limiter.tryAcquire("b"), "b was rejected because a used its token");
        });
        test("exact under concurrent calls", () -> {
            RateLimiter limiter = new RateLimiter(1_000, 0.0, () -> 0L);
            java.util.concurrent.atomic.AtomicInteger allowed = new java.util.concurrent.atomic.AtomicInteger();
            java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(8);
            for (int t = 0; t < 8; t++) {
                pool.submit(() -> { for (int i = 0; i < 250; i++) if (limiter.tryAcquire("hot")) allowed.incrementAndGet(); });
            }
            pool.shutdown();
            pool.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);
            check(allowed.get() == 1_000, "expected exactly 1000 allowed calls but got " + allowed.get());
        });
    }

    interface Body { void run() throws Exception; }

    static void test(String name, Body body) {
        try {
            body.run();
            System.out.println("PASS " + name);
        } catch (Throwable e) {
            System.out.println("FAIL " + name + ": " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
        }
    }

    static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
