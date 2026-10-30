@Service
class DepositService(
    private val depositRepository: DepositRepository,
    private val paymentClient: PaymentClient,
) {
    fun deposit(request: DepositRequest): Deposit {
        val deposit = Deposit(userId = request.userId, amount = request.amount)
        return saveAndCharge(deposit)
    }

    @Transactional
    fun saveAndCharge(deposit: Deposit): Deposit {
        depositRepository.save(deposit)
        paymentClient.charge(deposit.userId, deposit.amount)
        deposit.status = DepositStatus.CREDITED
        return depositRepository.save(deposit)
    }
}
