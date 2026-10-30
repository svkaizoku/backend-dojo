@Service
public class WithdrawalService {
    private final StringRedisTemplate redis;
    private final AccountRepository accounts;
    private final BankClient bankClient;

    public WithdrawalService(StringRedisTemplate redis, AccountRepository accounts, BankClient bankClient) {
        this.redis = redis;
        this.accounts = accounts;
        this.bankClient = bankClient;
    }

    @Transactional
    public void withdraw(long accountId, BigDecimal amount) {
        String lockKey = "lock:account:" + accountId;
        Boolean locked = redis.opsForValue().setIfAbsent(lockKey, "1");
        if (!locked) {
            throw new IllegalStateException("Withdrawal already in progress");
        }

        Account account = accounts.findById(accountId).orElseThrow();
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException(accountId);
        }
        account.setBalance(account.getBalance().subtract(amount));
        bankClient.sendPayout(account.getIban(), amount);
        redis.delete(lockKey);
    }
}
