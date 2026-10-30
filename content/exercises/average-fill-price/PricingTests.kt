fun main() {
    test("single fill averages to its price") {
        val avg = averagePrice(listOf(Fill(10, BigDecimal("101.25"))))
        check(avg.toPlainString() == "101.2500") { "expected 101.2500 but was ${avg.toPlainString()}" }
    }
    test("weights each fill by quantity") {
        val avg = averagePrice(listOf(Fill(100, BigDecimal("10.00")), Fill(300, BigDecimal("10.40"))))
        check(avg.toPlainString() == "10.3000") { "expected 10.3000 but was ${avg.toPlainString()}" }
    }
    test("rounds to 4 decimals half-even") {
        val avg = averagePrice(listOf(Fill(1, BigDecimal("1.00")), Fill(2, BigDecimal("2.00"))))
        check(avg.toPlainString() == "1.6667") { "expected 1.6667 but was ${avg.toPlainString()}" }
    }
    test("no fills gives zero") {
        val avg = averagePrice(emptyList())
        check(avg.signum() == 0) { "expected 0 but was ${avg.toPlainString()}" }
    }
}

fun test(name: String, body: () -> Unit) {
    try {
        body()
        println("PASS $name")
    } catch (e: Throwable) {
        println("FAIL $name: ${e.message ?: e::class.simpleName}")
    }
}
