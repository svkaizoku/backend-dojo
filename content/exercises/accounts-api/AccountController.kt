@RestController
class AccountController {

    @Autowired
    lateinit var accountRepository: AccountRepository

    @GetMapping("/accounts")
    fun getAccounts(): List<Account> =
        accountRepository.findAll()

    @PostMapping("/accounts/{id}/withdraw")
    fun withdraw(@PathVariable id: Long, @RequestParam amount: Double): Account {
        val account = accountRepository.findById(id).get()
        account.balance = account.balance - amount
        return accountRepository.save(account)
    }

    @ExceptionHandler(Exception::class)
    fun handle(e: Exception): String = e.message ?: "error"
}
