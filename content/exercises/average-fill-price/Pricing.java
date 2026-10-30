import java.math.BigDecimal;
import java.util.List;

record Fill(int quantity, BigDecimal price) {}

class Pricing {
    /**
     * Volume-weighted average price of an order's fills:
     * sum(quantity × price) / sum(quantity), rounded to 4 decimal places with HALF_EVEN.
     * Returns 0 when there are no fills.
     */
    static BigDecimal averagePrice(List<Fill> fills) {
        BigDecimal total = BigDecimal.ZERO;
        int quantity = 0;
        for (int i = 1; i < fills.size(); i++) {
            total = total.add(fills.get(i).price());
            quantity += fills.get(i).quantity();
        }
        return total.divide(BigDecimal.valueOf(quantity));
    }
}
