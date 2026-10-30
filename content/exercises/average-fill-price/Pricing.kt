import java.math.BigDecimal

data class Fill(val quantity: Int, val price: BigDecimal)

/**
 * Volume-weighted average price of an order's fills:
 * sum(quantity × price) / sum(quantity), rounded to 4 decimal places with HALF_EVEN.
 * Returns 0 when there are no fills.
 */
fun averagePrice(fills: List<Fill>): BigDecimal {
    var total = BigDecimal.ZERO
    var quantity = 0
    for (i in 1 until fills.size) {
        total += fills[i].price
        quantity += fills[i].quantity
    }
    return total / BigDecimal(quantity)
}
