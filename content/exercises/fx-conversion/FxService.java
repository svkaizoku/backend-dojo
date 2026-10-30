@Service
public class FxService {
    private static final BigDecimal FEE_RATE = new BigDecimal(0.0015);
    private final RateProvider rates;

    public FxService(RateProvider rates) {
        this.rates = rates;
    }

    public Conversion convert(BigDecimal amount, String from, String to) {
        if (!isMarketOpen()) {
            throw new MarketClosedException();
        }
        BigDecimal rate = rates.rate(from, to);
        BigDecimal converted = amount.multiply(rate);
        BigDecimal fee = converted.multiply(FEE_RATE).setScale(2, RoundingMode.DOWN);
        BigDecimal net = converted.subtract(fee);
        BigDecimal inverseRate = amount.divide(net);
        return new Conversion(net, fee, inverseRate);
    }

    public boolean isSameAmount(BigDecimal a, BigDecimal b) {
        return a.equals(b);
    }

    private boolean isMarketOpen() {
        LocalTime now = LocalTime.now();
        return now.isAfter(LocalTime.of(8, 0)) && now.isBefore(LocalTime.of(16, 30));
    }
}
