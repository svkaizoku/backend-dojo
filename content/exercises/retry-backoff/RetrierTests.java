public class Main {
    public static void main(String[] args) {
        test("returns the first success", () -> {
            java.util.List<Long> sleeps = new java.util.ArrayList<>();
            String result = new Retrier(3, 100, sleeps::add).call(() -> "ok");
            check("ok".equals(result), "expected ok but was " + result);
            check(sleeps.isEmpty(), "slept " + sleeps + " before a successful first call");
        });
        test("makes exactly maxAttempts calls", () -> {
            int[] calls = {0};
            try { new Retrier(3, 100, d -> {}).call(() -> { calls[0]++; throw new java.io.IOException("down"); }); } catch (Exception ignored) {}
            check(calls[0] == 3, "made " + calls[0] + " calls, expected 3");
        });
        test("doubles the delay between attempts", () -> {
            java.util.List<Long> sleeps = new java.util.ArrayList<>();
            int[] calls = {0};
            new Retrier(4, 100, sleeps::add).call(() -> { calls[0]++; if (calls[0] < 4) throw new java.io.IOException("down"); return "ok"; });
            check(sleeps.equals(java.util.List.of(100L, 200L, 400L)), "slept " + sleeps + ", expected [100, 200, 400]");
        });
        test("does not sleep after the last attempt", () -> {
            java.util.List<Long> sleeps = new java.util.ArrayList<>();
            try { new Retrier(3, 100, sleeps::add).call(() -> { throw new java.io.IOException("down"); }); } catch (Exception ignored) {}
            check(sleeps.equals(java.util.List.of(100L, 200L)), "slept " + sleeps + ", expected [100, 200]");
        });
        test("rethrows the last failure", () -> {
            int[] calls = {0};
            Exception error = null;
            try { new Retrier(3, 100, d -> {}).call(() -> { calls[0]++; throw new java.io.IOException("down #" + calls[0]); }); } catch (Exception e) { error = e; }
            check(error instanceof java.io.IOException && "down #3".equals(error.getMessage()), "expected IOException(down #3) but got " + error);
        });
        test("does not retry invalid arguments", () -> {
            int[] calls = {0};
            Exception error = null;
            try { new Retrier(3, 100, d -> {}).call(() -> { calls[0]++; throw new IllegalArgumentException("bad input"); }); } catch (Exception e) { error = e; }
            check(calls[0] == 1, "made " + calls[0] + " calls for a bad request, expected 1");
            check(error instanceof IllegalArgumentException, "expected IllegalArgumentException but got " + error);
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
