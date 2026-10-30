@Repository
public class OrderHistoryDao {
    private final JdbcTemplate jdbc;

    public OrderHistoryDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<OrderRow> history(long userId, String ticker, String sort, int page) {
        String sql = "SELECT * FROM orders WHERE user_id = " + userId
                + " AND ticker = '" + ticker + "'"
                + " ORDER BY " + sort
                + " LIMIT 50 OFFSET " + (page * 50);
        return jdbc.query(sql, (rs, i) -> new OrderRow(
                rs.getLong("id"),
                rs.getString("ticker"),
                rs.getDouble("price"),
                rs.getInt("quantity"),
                rs.getTimestamp("created_at").toLocalDateTime()));
    }
}
