@Service
class InstrumentService(
    private val repository: InstrumentRepository,
    private val priceClient: PriceClient,
    private val redis: StringRedisTemplate,
) {
    fun view(ticker: String, currency: String): InstrumentView {
        val instrument = findInstrument(ticker)
        return InstrumentView(instrument, priceIn(ticker, currency))
    }

    @Cacheable("instruments")
    fun findInstrument(ticker: String): Instrument =
        repository.findByTicker(ticker)

    @Cacheable(value = ["prices"], key = "#ticker")
    fun priceIn(ticker: String, currency: String): BigDecimal =
        priceClient.latest(ticker, currency)

    fun evictAll() {
        val keys = redis.keys("instruments::*")
        redis.delete(keys)
    }
}
