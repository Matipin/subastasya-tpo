
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.xtabtnnnxdnwhbttyfdq:n4%2Fi%23X%2Ca%2CBt%237kS@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // 1. Convertir a todos los clientes a Platino
        await client.query("UPDATE clientes SET categoria = 'platino'");
        console.log("✅ Todos los usuarios ahora son Platino.");

        // 2. Obtener la subasta platino más reciente
        const subRes = await client.query("SELECT identificador FROM subastas WHERE categoria = 'platino' ORDER BY identificador DESC LIMIT 1");
        if (subRes.rows.length === 0) {
            console.log("❌ No se encontró la subasta platino.");
            return;
        }
        const subastaId = subRes.rows[0].identificador;

        // 3. Obtener todos los clientes
        const clientesRes = await client.query("SELECT identificador FROM clientes");
        let count = 0;
        
        for (const c of clientesRes.rows) {
            // Verificar si ya está anotado
            const check = await client.query("SELECT identificador FROM asistentes WHERE cliente_identificador = $1 AND subasta_identificador = $2", [c.identificador, subastaId]);
            
            if (check.rows.length === 0) {
                // Anotar
                const numeroPostor = Math.floor(Math.random() * 10000) + 1;
                await client.query("INSERT INTO asistentes (numero_postor, cliente_identificador, subasta_identificador) VALUES ($1, $2, $3)", [numeroPostor, c.identificador, subastaId]);
                count++;
            }
        }

        console.log(`✅ ${count} usuarios anotados a la subasta Platino (ID: ${subastaId}).`);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
