@Service
public class TradeEventListener {
    private final PositionRepository positionRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TradeEventListener(PositionRepository positionRepository,
                              KafkaTemplate<String, String> kafkaTemplate) {
        this.positionRepository = positionRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "trades")
    @Transactional
    public void onTrade(String message) throws Exception {
        TradeEvent trade = objectMapper.readValue(message, TradeEvent.class);
        Position position = positionRepository.findByUserIdAndTicker(trade.userId(), trade.ticker());
        position.setQuantity(position.getQuantity().add(trade.quantity()));
        positionRepository.save(position);
        kafkaTemplate.send("position-updated", trade.userId(), objectMapper.writeValueAsString(position));
    }
}
