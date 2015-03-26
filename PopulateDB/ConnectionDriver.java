import java.sql.*;
import java.util.Collection;

public class ConnectionDriver {
    static final String DRIVER = "oracle.jdbc.driver.OracleDriver";
    static final String URL = "jdbc:oracle:thin@//mycis550db.c0zcgg5oelhe.us-west-2.rds.amazonaws.com:1521/MYDB";

    static final String USER = "cis550nalt";
    static final String PASS = "cis550nalt";

    private Statement stmt  = null;
    private Connection conn = null;

    public ConnectionDriver() {
        try {
            Class.forName(DRIVER);
            System.out.println("Establishing connection to database...");
            conn = DriverManager.getConnection(URL, USER, PASS);
            System.out.println("Connection made.");
            stmt = conn.createStatement();
        } catch (SQLException e) {
            e.printStackTrace();
            try {
                if (conn != null) { conn.close(); }
            } catch (SQLException e1) {
                e.printStackTrace();
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public void executeUpdate(String sql) {
        try {
            stmt.executeUpdate(sql);
        } catch (SQLException e) {
            e.printStackTrace();
            try {
                stmt.close();
                conn.close();
            } catch (SQLException e1) {
                e.printStackTrace();
            }
        }
    }

    public void executeUpdate(Collection<String> sqlSet) {
        for (String sql : sqlSet) {
            executeUpdate(sql);
        }
    }

    public void close() {
        try {
            if (stmt != null) { stmt.close(); }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        try {
            if (conn != null) { conn.close(); }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
