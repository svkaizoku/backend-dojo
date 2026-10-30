@Service
class PortfolioService(private val userRepository: UserRepository) {

    @Transactional(readOnly = true)
    fun summaries(): List<PortfolioSummary> =
        userRepository.findAll().map { user ->
            val total = user.positions
                .fold(BigDecimal.ZERO) { acc, p -> acc + p.marketValue }
            PortfolioSummary(user.id, total)
        }
}

@Entity
class User(
    @Id
    val id: Long,

    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER)
    val positions: List<Position> = emptyList(),
)
