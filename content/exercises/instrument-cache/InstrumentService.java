@Service
public class InstrumentService {
    private final InstrumentRepository repository;
    private final PriceClient priceClient;
    private final StringRedisTemplate redis;

    public InstrumentService(InstrumentRepository repository, PriceClient priceClient, StringRedisTemplate redis) {
        this.repository = repository;
        this.priceClient = priceClient;
        this.redis = redis;
    }

    public InstrumentView view(String ticker, String currency) {
        Instrument instrument = findInstrument(ticker);
        return new InstrumentView(instrument, priceIn(ticker, currency));
    }

    @Cacheable("instruments")
    public Instrument findInstrument(String ticker) {
        return repository.findByTicker(ticker);
    }

    @Cacheable(value = "prices", key = "#ticker")
    public BigDecimal priceIn(String ticker, String currency) {
        return priceClient.latest(ticker, currency);
    }

    public void evictAll() {
        Set<String> keys = redis.keys("instruments::*");
        redis.delete(keys);
    }
}
