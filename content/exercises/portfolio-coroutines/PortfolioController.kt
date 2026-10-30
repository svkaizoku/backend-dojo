@RestController
class PortfolioController(
    private val positions: PositionRepository,
    private val priceClient: PriceClient,
    private val audit: AuditService,
) {
    @GetMapping("/portfolio/{userId}")
    fun portfolio(@PathVariable userId: Long): PortfolioView = runBlocking {
        val held = positions.findAllByUserId(userId)

        val priced = held.map { position ->
            async(Dispatchers.Default) {
                val price = runCatching { priceClient.latest(position.ticker) }.getOrNull()
                PricedPosition(position, price)
            }
        }.awaitAll()

        GlobalScope.launch { audit.record(userId, "viewed portfolio") }

        PortfolioView(priced, priced.sumOf { it.value() })
    }
}
