@RestController
public class AccountController {

    @Autowired
    private AccountRepository accountRepository;

    @GetMapping("/accounts")
    public List<Account> getAccounts() {
        return accountRepository.findAll();
    }

    @PostMapping("/accounts/{id}/withdraw")
    public Account withdraw(@PathVariable Long id, @RequestParam double amount) {
        Account account = accountRepository.findById(id).get();
        account.setBalance(account.getBalance() - amount);
        return accountRepository.save(account);
    }

    @ExceptionHandler(Exception.class)
    public String handle(Exception e) {
        return e.getMessage();
    }
}
