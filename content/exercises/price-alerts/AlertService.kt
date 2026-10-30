@Service
class AlertService(
    private val priceFeed: PriceFeed,
    private val notifier: Notifier,
) {
    private val alerts = ConcurrentHashMap<Long, Alert>()
    private val notifyPool = Executors.newFixedThreadPool(4)
    private val scheduler = Executors.newSingleThreadScheduledExecutor()

    init {
        scheduler.scheduleAtFixedRate(::expireOldAlerts, 1, 1, TimeUnit.MINUTES)
    }

    fun create(alert: Alert) {
        alerts[alert.id] = alert
        priceFeed.subscribe(alert.ticker) { price ->
            if (price >= alert.target) {
                notifyPool.submit { notifier.send(alert.userId, "${alert.ticker} hit $price") }
            }
        }
    }

    fun delete(alertId: Long) {
        alerts.remove(alertId)
    }

    private fun expireOldAlerts() {
        for (alert in alerts.values) {
            if (alert.expiresAt.isBefore(Instant.now())) {
                alerts.remove(alert.id)
                notifier.send(alert.userId, "Alert expired: ${alert.ticker}")
            }
        }
    }
}
