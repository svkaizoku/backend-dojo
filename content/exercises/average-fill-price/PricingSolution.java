import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

record Fill(int quantity, BigDecimal price) {}

class Pricing {
    static BigDecimal averagePrice(List<Fill> fills) {
        if (fills.isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        long quantity = 0;
        for (Fill fill : fills) {
            total = total.add(fill.price().multiply(BigDecimal.valueOf(fill.quantity())));
            quantity += fill.quantity();
        }
        return total.divide(BigDecimal.valueOf(quantity), 4, RoundingMode.HALF_EVEN);
    }
}
