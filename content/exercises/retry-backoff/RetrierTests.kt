fun main() {
    test("returns the first success") {
        val sleeps = mutableListOf<Long>()
        val result = Retrier(3, 100) { sleeps += it }.call { "ok" }
        check(result == "ok") { "expected ok but was $result" }
        check(sleeps.isEmpty()) { "slept $sleeps before a successful first call" }
    }
    test("makes exactly maxAttempts calls") {
        var calls = 0
        runCatching { Retrier(3, 100) {}.call<String> { calls++; throw java.io.IOException("down") } }
        check(calls == 3) { "made $calls calls, expected 3" }
    }
    test("doubles the delay between attempts") {
        val sleeps = mutableListOf<Long>()
        var calls = 0
        Retrier(4, 100) { sleeps += it }.call { calls++; if (calls < 4) throw java.io.IOException("down") else "ok" }
        check(sleeps == listOf(100L, 200L, 400L)) { "slept $sleeps, expected [100, 200, 400]" }
    }
    test("does not sleep after the last attempt") {
        val sleeps = mutableListOf<Long>()
        runCatching { Retrier(3, 100) { sleeps += it }.call<String> { throw java.io.IOException("down") } }
        check(sleeps == listOf(100L, 200L)) { "slept $sleeps, expected [100, 200]" }
    }
    test("rethrows the last failure") {
        var calls = 0
        val error = runCatching { Retrier(3, 100) {}.call<String> { calls++; throw java.io.IOException("down #$calls") } }.exceptionOrNull()
        check(error is java.io.IOException && error.message == "down #3") { "expected IOException(down #3) but got $error" }
    }
    test("does not retry invalid arguments") {
        var calls = 0
        val error = runCatching { Retrier(3, 100) {}.call<String> { calls++; throw IllegalArgumentException("bad input") } }.exceptionOrNull()
        check(calls == 1) { "made $calls calls for a bad request, expected 1" }
        check(error is IllegalArgumentException) { "expected IllegalArgumentException but got $error" }
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
