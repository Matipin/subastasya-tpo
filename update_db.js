process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.xtabtnnnxdnwhbttyfdq:n4%2Fi%23X%2Ca%2CBt%237kS@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // Check itemscatalogo
        const res = await client.query(`SELECT identificador, producto, subastado FROM itemscatalogo`);
        console.log("Items en el catalogo:");
        console.log(res.rows);

        // Actualizar itemscatalogo para que subastado='no' si está en 'si'
        await client.query(`UPDATE itemscatalogo SET subastado = 'no'`);
        console.log("Actualizados items a subastado='no'");

        // Anotar al usuario 6 a la subasta 1
        const resAsistente = await client.query(`INSERT INTO asistentes (numeropostor, cliente, subasta) VALUES (888, 6, 1) RETURNING identificador`);
        console.log("Usuario 6 anotado en la subasta 1 con identificador de asistente:", resAsistente.rows[0].identificador);

    } catch(err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
