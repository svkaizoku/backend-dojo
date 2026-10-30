fun main() {
    test("keeps at most capacity entries") {
        val cache = LruCache<String, Int>(2)
        cache.put("a", 1); cache.put("b", 2); cache.put("c", 3)
        check(cache.size == 2) { "size is ${cache.size}, expected 2" }
    }
    test("evicts the least recently used entry") {
        val cache = LruCache<String, Int>(2)
        cache.put("a", 1); cache.put("b", 2); cache.put("c", 3)
        check(cache.get("a") == null) { "a should have been evicted" }
        check(cache.get("b") == 2 && cache.get("c") == 3) { "b and c should still be cached" }
    }
    test("get counts as a use") {
        val cache = LruCache<String, Int>(2)
        cache.put("a", 1); cache.put("b", 2)
        cache.get("a")
        cache.put("c", 3)
        check(cache.get("a") == 1) { "a was used recently but got evicted" }
        check(cache.get("b") == null) { "b was least recently used but is still cached" }
    }
    test("updating a key keeps size and refreshes it") {
        val cache = LruCache<String, Int>(2)
        cache.put("a", 1); cache.put("b", 2)
        cache.put("a", 10)
        cache.put("c", 3)
        check(cache.size == 2) { "size is ${cache.size}, expected 2" }
        check(cache.get("a") == 10) { "a should hold the updated value 10" }
        check(cache.get("b") == null) { "b should have been evicted" }
    }
    test("rejects a capacity below 1") {
        val rejected = try { LruCache<String, Int>(0); false } catch (e: IllegalArgumentException) { true }
        check(rejected) { "capacity 0 should throw IllegalArgumentException" }
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
