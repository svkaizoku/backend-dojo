@Repository
class OrderHistoryDao(private val jdbc: JdbcTemplate) {

    fun history(userId: Long, ticker: String, sort: String, page: Int): List<OrderRow> {
        val sql = """
            SELECT * FROM orders
            WHERE user_id = $userId AND ticker = '$ticker'
            ORDER BY $sort
            LIMIT 50 OFFSET ${page * 50}
        """.trimIndent()
        return jdbc.query(sql) { rs, _ ->
            OrderRow(
                id = rs.getLong("id"),
                ticker = rs.getString("ticker"),
                price = rs.getDouble("price"),
                quantity = rs.getInt("quantity"),
                createdAt = rs.getTimestamp("created_at").toLocalDateTime(),
            )
        }
    }
}
