public class Main {
    public static void main(String[] args) {
        test("keeps at most capacity entries", () -> {
            LruCache<String, Integer> cache = new LruCache<>(2);
            cache.put("a", 1); cache.put("b", 2); cache.put("c", 3);
            check(cache.size() == 2, "size is " + cache.size() + ", expected 2");
        });
        test("evicts the least recently used entry", () -> {
            LruCache<String, Integer> cache = new LruCache<>(2);
            cache.put("a", 1); cache.put("b", 2); cache.put("c", 3);
            check(cache.get("a") == null, "a should have been evicted");
            check(Integer.valueOf(2).equals(cache.get("b")) && Integer.valueOf(3).equals(cache.get("c")), "b and c should still be cached");
        });
        test("get counts as a use", () -> {
            LruCache<String, Integer> cache = new LruCache<>(2);
            cache.put("a", 1); cache.put("b", 2);
            cache.get("a");
            cache.put("c", 3);
            check(Integer.valueOf(1).equals(cache.get("a")), "a was used recently but got evicted");
            check(cache.get("b") == null, "b was least recently used but is still cached");
        });
        test("updating a key keeps size and refreshes it", () -> {
            LruCache<String, Integer> cache = new LruCache<>(2);
            cache.put("a", 1); cache.put("b", 2);
            cache.put("a", 10);
            cache.put("c", 3);
            check(cache.size() == 2, "size is " + cache.size() + ", expected 2");
            check(Integer.valueOf(10).equals(cache.get("a")), "a should hold the updated value 10");
            check(cache.get("b") == null, "b should have been evicted");
        });
        test("rejects a capacity below 1", () -> {
            boolean rejected;
            try { new LruCache<String, Integer>(0); rejected = false; } catch (IllegalArgumentException e) { rejected = true; }
            check(rejected, "capacity 0 should throw IllegalArgumentException");
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
