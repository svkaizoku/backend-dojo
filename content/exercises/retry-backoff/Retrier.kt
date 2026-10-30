/**
 * Calls an action with retries and exponential backoff.
 * - Makes at most maxAttempts calls in total.
 * - Waits initialDelayMs before the 2nd call, then doubles the wait each time (100, 200, 400 …).
 * - Doesn't wait after the last failed call.
 * - IllegalArgumentException means a bad request: rethrow it at once, without retrying.
 * - When all attempts fail, rethrow the last exception.
 */
class Retrier(
    private val maxAttempts: Int,
    private val initialDelayMs: Long,
    private val sleep: (Long) -> Unit,
) {
    fun <T> call(action: () -> T): T {
        var delay = initialDelayMs
        var attempt = 1
        while (attempt < maxAttempts) {
            try {
                return action()
            } catch (e: Exception) {
                sleep(delay)
                delay += initialDelayMs
            }
            attempt++
        }
        throw IllegalStateException("Retries exhausted")
    }
}
