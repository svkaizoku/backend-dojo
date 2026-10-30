@Service
class FxService(private val rates: RateProvider) {

    fun convert(amount: BigDecimal, from: String, to: String): Conversion {
        if (!isMarketOpen()) throw MarketClosedException()
        val rate = rates.rate(from, to)
        val converted = amount * rate
        val fee = (converted * FEE_RATE).setScale(2, RoundingMode.DOWN)
        val net = converted - fee
        val inverseRate = amount / net
        return Conversion(net, fee, inverseRate)
    }

    fun isSameAmount(a: BigDecimal, b: BigDecimal): Boolean = a == b

    private fun isMarketOpen(): Boolean {
        val now = LocalTime.now()
        return now.isAfter(LocalTime.of(8, 0)) && now.isBefore(LocalTime.of(16, 30))
    }

    companion object {
        private val FEE_RATE = BigDecimal(0.0015)
    }
}
