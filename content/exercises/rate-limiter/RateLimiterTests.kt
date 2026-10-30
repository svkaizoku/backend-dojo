fun main() {
    test("allows a burst up to capacity") {
        val limiter = RateLimiter(3, 1.0) { 0L }
        repeat(3) { check(limiter.tryAcquire("u1")) { "call ${it + 1} of 3 was rejected" } }
        check(!limiter.tryAcquire("u1")) { "4th call was allowed" }
    }
    test("refills over time") {
        var now = 0L
        val limiter = RateLimiter(2, 1.0) { now }
        limiter.tryAcquire("u1"); limiter.tryAcquire("u1")
        now = 500
        check(!limiter.tryAcquire("u1")) { "allowed after only half a token refilled" }
        now = 1_000
        check(limiter.tryAcquire("u1")) { "rejected after a full token refilled" }
        check(!limiter.tryAcquire("u1")) { "allowed a second call with only one token refilled" }
    }
    test("never refills above capacity") {
        var now = 0L
        val limiter = RateLimiter(2, 1.0) { now }
        now = 60_000
        repeat(2) { check(limiter.tryAcquire("u1")) { "call ${it + 1} of 2 was rejected" } }
        check(!limiter.tryAcquire("u1")) { "allowed more than capacity after a long idle period" }
    }
    test("keys are independent") {
        val limiter = RateLimiter(1, 1.0) { 0L }
        check(limiter.tryAcquire("a")) { "first call for a was rejected" }
        check(limiter.tryAcquire("b")) { "b was rejected because a used its token" }
    }
    test("exact under concurrent calls") {
        val limiter = RateLimiter(1_000, 0.0) { 0L }
        val allowed = java.util.concurrent.atomic.AtomicInteger()
        val pool = java.util.concurrent.Executors.newFixedThreadPool(8)
        repeat(8) { pool.submit { repeat(250) { if (limiter.tryAcquire("hot")) allowed.incrementAndGet() } } }
        pool.shutdown()
        pool.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS)
        check(allowed.get() == 1_000) { "expected exactly 1000 allowed calls but got ${allowed.get()}" }
    }
}

fun test(name: String, body: () -> Unit) {
    try {
        body()
        println("PASS $name")
    } catch (e: Throwable) {
        println("FAIL $name: ${e.message ?: e::class.simpleName}")
    }
}
