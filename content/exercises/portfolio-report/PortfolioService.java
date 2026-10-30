@Service
public class PortfolioService {
    private final UserRepository userRepository;

    public PortfolioService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PortfolioSummary> summaries() {
        List<User> users = userRepository.findAll();
        List<PortfolioSummary> result = new ArrayList<>();
        for (User user : users) {
            BigDecimal total = BigDecimal.ZERO;
            for (Position p : user.getPositions()) {
                total = total.add(p.getMarketValue());
            }
            result.add(new PortfolioSummary(user.getId(), total));
        }
        return result;
    }
}

@Entity
public class User {
    @Id
    private Long id;

    @OneToMany(mappedBy = "user", fetch = FetchType.EAGER)
    private List<Position> positions;
}
