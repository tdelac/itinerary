import java.sql.*;
import java.io.*;
import java.util.Collection;
import oracle.xdb.*;


/*
 * COMPILE COMMAND:
 * javac -cp ojdbc7.jar ConnectionDriver.java
 *
 * RUN COMMAND:
 * java -cp .:ojdbc7.jar ConnectionDriver
 */


public class ConnectionDriver {
    static final String DRIVER = "oracle.jdbc.driver.OracleDriver";

    private Connection conn = null;
    private Statement glblStmt = null;

    public ConnectionDriver() throws SecurityException {
        try {
            Class.forName(DRIVER);

            System.out.println("Establishing connection to database...");
            String[] creds = getCredentials();
            if (creds.length < 3) {
                System.out.println("Error parsing credentials file");
                throw new SecurityException();
            }
            conn = DriverManager.getConnection(creds[0], creds[1], creds[2]);
            System.out.println("Connection made.");

            glblStmt = conn.createStatement();
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

    private String[] getCredentials() throws SecurityException {
        BufferedReader br = null;
        String[] ret = new String[3];
        
        try {
            br = new BufferedReader(new FileReader("login.txt"));

            String ln = br.readLine();
            if (ln == null) { throw new SecurityException(); }
            String[] tmp = ln.split(" ");
            if (tmp.length < 2 || !tmp[0].equals("URL:")) { throw new SecurityException(); }
            ret[0] = tmp[1];

            ln = br.readLine();
            if (ln == null) { throw new SecurityException(); }
            tmp = ln.split(" ");
            if (tmp.length < 2 || !tmp[0].equals("USER:")) { throw new SecurityException(); }
            ret[1] = tmp[1];

            ln = br.readLine();
            if (ln == null) { throw new SecurityException(); }
            tmp = ln.split(" ");
            if (tmp.length < 2 || !tmp[0].equals("PASS:")) { throw new SecurityException(); }
            ret[2] = tmp[1];

        } catch (FileNotFoundException e) {
            System.out.println("Credentials file not found. Are you sure you're" 
                + " supposed to be here?");
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                if (br != null) { br.close(); }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return ret;
    }

    public void addBatch(String sql) {
        try {
          if (glblStmt == null) {
            glblStmt = conn.createStatement();
          }         
          glblStmt.addBatch(sql);
        } catch (SQLException e) {
          e.printStackTrace();
            try {
              glblStmt.close();
              conn.close();
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        } 
    }

    public void executeBatch() {
        try {
          glblStmt.executeBatch();
          glblStmt.close();
          glblStmt = null;
        } catch (SQLException e) {
          e.printStackTrace();
            try {
              glblStmt.close();
              conn.close();
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        } 
    }

    public void executeInsert(String sql) {
        Statement stmt = null; 
        try {
            stmt = conn.createStatement();
            stmt.executeUpdate(sql);
            stmt.close();
        } catch (SQLException e) {
            e.printStackTrace();
            try {
                stmt.close();
                conn.close();
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        }
    }

    public void executeSelect(String sql) {
      Statement stmt = null;
      ResultSet rs;
      try {
        stmt = conn.createStatement();
        rs = stmt.executeQuery(sql);

        while (rs.next()) {
          String uid = rs.getString("user_id");
          int iid = rs.getInt("itinerary_id");
          XMLType xml = (XMLType) rs.getObject("itinerary_data");
          System.out.println(uid);
          System.out.println(iid);
          System.out.println(xml);
        }
        rs.close();
        stmt.close();
      } catch (SQLException e) {
        e.printStackTrace();
        try {
          stmt.close();
          conn.close();
        } catch (SQLException e1) {
          e1.printStackTrace();
        }
      }
    }

    public void executeSelect(Collection<String> sqlSet) {
      for (String sql : sqlSet) {
        executeSelect(sql);
      }
    }

    public void executeInsert(Collection<String> sqlSet) {
        for (String sql : sqlSet) {
            executeInsert(sql);
        }
    }

    public void executeCreate(String sql) {
        executeInsert(sql);
    }

    public void executeCreate(Collection<String> sqlSet) {
        executeInsert(sqlSet);
    }

    public void executeDrop(String sql) {
        executeInsert(sql);
    }

    public void executeDrop(Collection<String> sqlSet) {
        executeInsert(sqlSet);
    }

    public void close() {
        try {
            if (conn != null) { conn.close(); }
            if (glblStmt != null) { glblStmt.close(); }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        ConnectionDriver test = new ConnectionDriver();
        test.close();
    }
}
