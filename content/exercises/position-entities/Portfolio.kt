@Entity
@Table(name = "portfolios")
data class Portfolio(
    @Id
    @GeneratedValue
    var id: Long? = null,

    val userId: Long,

    @OneToMany(mappedBy = "portfolio", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val positions: MutableList<Position> = mutableListOf(),
)

@Entity
@Table(name = "positions")
data class Position(
    @Id
    @GeneratedValue
    var id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    val portfolio: Portfolio,

    val ticker: String,
    var quantity: BigDecimal,
)

@Service
class PositionService(private val portfolios: PortfolioRepository) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun add(userId: Long, ticker: String, quantity: BigDecimal) {
        val portfolio = portfolios.findByUserId(userId)!!
        val existing = portfolio.positions.find { it.ticker == ticker }
        if (existing != null) {
            existing.quantity += quantity
        } else {
            portfolio.positions.add(Position(portfolio = portfolio, ticker = ticker, quantity = quantity))
        }
        log.info("Updated portfolio {}", portfolio)
    }
}
