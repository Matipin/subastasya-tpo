import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class UpdateDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require";
        String user = "postgres.rveowknhrsvikdizudof";
        String password = "19176378matias";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Connected to DB!");
            stmt.executeUpdate("UPDATE subastas SET estado = 'abierta', hora = '16:00:00' WHERE identificador = 1");
            stmt.executeUpdate("UPDATE itemscatalogo SET subastado = 'no'");
            System.out.println("Subasta 1 updated to abierta at 16:00, items set to subastado=no");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
