@Service
public class DepositService {
    private final DepositRepository depositRepository;
    private final PaymentClient paymentClient;

    public DepositService(DepositRepository depositRepository, PaymentClient paymentClient) {
        this.depositRepository = depositRepository;
        this.paymentClient = paymentClient;
    }

    public Deposit deposit(DepositRequest request) {
        Deposit deposit = new Deposit(request.getUserId(), request.getAmount());
        return saveAndCharge(deposit);
    }

    @Transactional
    public Deposit saveAndCharge(Deposit deposit) {
        depositRepository.save(deposit);
        paymentClient.charge(deposit.getUserId(), deposit.getAmount());
        deposit.setStatus(DepositStatus.CREDITED);
        return depositRepository.save(deposit);
    }
}
