@Service
class QuoteCache(private val priceClient: PriceClient) {
    private val cache = HashMap<String, Quote>()

    var hits = 0
        private set

    fun get(ticker: String): Quote {
        if (!cache.containsKey(ticker)) {
            val quote = priceClient.fetch(ticker)
            cache[ticker] = quote
        } else {
            hits++
        }
        return cache[ticker]!!
    }

    fun clear() {
        cache.clear()
    }
}
