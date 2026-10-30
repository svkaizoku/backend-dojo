@Service
class WithdrawalService(
    private val redis: StringRedisTemplate,
    private val accounts: AccountRepository,
    private val bankClient: BankClient,
) {
    @Transactional
    fun withdraw(accountId: Long, amount: BigDecimal) {
        val lockKey = "lock:account:$accountId"
        val locked = redis.opsForValue().setIfAbsent(lockKey, "1") ?: false
        check(locked) { "Withdrawal already in progress" }

        val account = accounts.findById(accountId).orElseThrow()
        if (account.balance < amount) {
            throw InsufficientFundsException(accountId)
        }
        account.balance -= amount
        bankClient.sendPayout(account.iban, amount)
        redis.delete(lockKey)
    }
}
