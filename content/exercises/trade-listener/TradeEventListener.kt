@Service
class TradeEventListener(
    private val positionRepository: PositionRepository,
    private val kafkaTemplate: KafkaTemplate<String, String>,
) {
    private val objectMapper = ObjectMapper()

    @KafkaListener(topics = ["trades"])
    @Transactional
    fun onTrade(message: String) {
        val trade = objectMapper.readValue(message, TradeEvent::class.java)
        val position = positionRepository.findByUserIdAndTicker(trade.userId, trade.ticker)!!
        position.quantity += trade.quantity
        positionRepository.save(position)
        kafkaTemplate.send("position-updated", trade.userId, objectMapper.writeValueAsString(position))
    }
}
