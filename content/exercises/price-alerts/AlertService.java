@Service
public class AlertService {
    private final PriceFeed priceFeed;
    private final Notifier notifier;
    private final Map<Long, Alert> alerts = new ConcurrentHashMap<>();
    private final ExecutorService notifyPool = Executors.newFixedThreadPool(4);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public AlertService(PriceFeed priceFeed, Notifier notifier) {
        this.priceFeed = priceFeed;
        this.notifier = notifier;
        scheduler.scheduleAtFixedRate(this::expireOldAlerts, 1, 1, TimeUnit.MINUTES);
    }

    public void create(Alert alert) {
        alerts.put(alert.id(), alert);
        priceFeed.subscribe(alert.ticker(), price -> {
            if (price.compareTo(alert.target()) >= 0) {
                notifyPool.submit(() -> notifier.send(alert.userId(), alert.ticker() + " hit " + price));
            }
        });
    }

    public void delete(long alertId) {
        alerts.remove(alertId);
    }

    private void expireOldAlerts() {
        for (Alert alert : alerts.values()) {
            if (alert.expiresAt().isBefore(Instant.now())) {
                alerts.remove(alert.id());
                notifier.send(alert.userId(), "Alert expired: " + alert.ticker());
            }
        }
    }
}
