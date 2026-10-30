@Service
public class QuoteCache {
    private final Map<String, Quote> cache = new HashMap<>();
    private final PriceClient priceClient;
    private int hits;

    public QuoteCache(PriceClient priceClient) {
        this.priceClient = priceClient;
    }

    public Quote get(String ticker) {
        if (!cache.containsKey(ticker)) {
            Quote quote = priceClient.fetch(ticker);
            cache.put(ticker, quote);
        } else {
            hits++;
        }
        return cache.get(ticker);
    }

    public int getHits() {
        return hits;
    }

    public void clear() {
        cache.clear();
    }
}
