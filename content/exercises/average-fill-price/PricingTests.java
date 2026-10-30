public class Main {
    public static void main(String[] args) {
        test("single fill averages to its price", () -> {
            java.math.BigDecimal avg = Pricing.averagePrice(java.util.List.of(new Fill(10, new java.math.BigDecimal("101.25"))));
            check(avg.toPlainString().equals("101.2500"), "expected 101.2500 but was " + avg.toPlainString());
        });
        test("weights each fill by quantity", () -> {
            java.math.BigDecimal avg = Pricing.averagePrice(java.util.List.of(
                    new Fill(100, new java.math.BigDecimal("10.00")), new Fill(300, new java.math.BigDecimal("10.40"))));
            check(avg.toPlainString().equals("10.3000"), "expected 10.3000 but was " + avg.toPlainString());
        });
        test("rounds to 4 decimals half-even", () -> {
            java.math.BigDecimal avg = Pricing.averagePrice(java.util.List.of(
                    new Fill(1, new java.math.BigDecimal("1.00")), new Fill(2, new java.math.BigDecimal("2.00"))));
            check(avg.toPlainString().equals("1.6667"), "expected 1.6667 but was " + avg.toPlainString());
        });
        test("no fills gives zero", () -> {
            java.math.BigDecimal avg = Pricing.averagePrice(java.util.List.of());
            check(avg.signum() == 0, "expected 0 but was " + avg.toPlainString());
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
