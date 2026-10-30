import java.math.BigDecimal
import java.math.RoundingMode

data class Fill(val quantity: Int, val price: BigDecimal)

fun averagePrice(fills: List<Fill>): BigDecimal {
    if (fills.isEmpty()) return BigDecimal.ZERO
    var total = BigDecimal.ZERO
    var quantity = 0L
    for (fill in fills) {
        total += fill.price * BigDecimal(fill.quantity)
        quantity += fill.quantity
    }
    return total.divide(BigDecimal(quantity), 4, RoundingMode.HALF_EVEN)
}
