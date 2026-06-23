process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.xtabtnnnxdnwhbttyfdq:n4%2Fi%23X%2Ca%2CBt%237kS@db.xtabtnnnxdnwhbttyfdq.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // Check all subastas
        await client.query(`UPDATE subastas SET hora = '16:00:00' WHERE identificador = 1`);
        const resSub = await client.query(`SELECT identificador, estado, fecha, hora FROM subastas`);
        console.log("Subastas:", resSub.rows);

    } catch(err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
