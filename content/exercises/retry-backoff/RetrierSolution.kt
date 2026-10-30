class Retrier(
    private val maxAttempts: Int,
    private val initialDelayMs: Long,
    private val sleep: (Long) -> Unit,
) {
    fun <T> call(action: () -> T): T {
        var delay = initialDelayMs
        var attempt = 1
        while (true) {
            try {
                return action()
            } catch (e: IllegalArgumentException) {
                throw e
            } catch (e: Exception) {
                if (attempt >= maxAttempts) throw e
                sleep(delay)
                delay *= 2
                attempt++
            }
        }
    }
}
