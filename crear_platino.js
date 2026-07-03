
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres.xtabtnnnxdnwhbttyfdq:n4%2Fi%23X%2Ca%2CBt%237kS@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // 1. Obtener un empleado y un dueño válidos
        const empRes = await client.query('SELECT identificador FROM empleados LIMIT 1');
        const adminId = empRes.rows[0].identificador;
        const dueRes = await client.query('SELECT identificador FROM duenios LIMIT 1');
        const duenioId = dueRes.rows[0].identificador;

        // Fecha y hora solicitada: 15:00 hora local (18:00 UTC)
        const fecha = '2026-07-03';
        const hora = '18:00:00'; // Formato HH:MM:SS (UTC)

        // 2. Insertar Subasta Platino
        const subastaRes = await client.query(`
            INSERT INTO subastas (categoria, estado, fecha, hora, capacidadasistentes, tienedeposito, seguridadpropia)
            VALUES ('platino', 'abierta', $1, $2, 20, 'si', 'si')
            RETURNING identificador;
        `, [fecha, hora]);
        const subastaId = subastaRes.rows[0].identificador;

        // 3. Insertar Catálogo
        const catalogoRes = await client.query(`
            INSERT INTO catalogos (descripcion, responsable, subasta)
            VALUES ('Catálogo Platino', $1, $2)
            RETURNING identificador;
        `, [adminId, subastaId]);
        const catalogoId = catalogoRes.rows[0].identificador;

        // 4. Insertar Producto (Mansión)
        const productoRes = await client.query(`
            INSERT INTO productos (descripcioncatalogo, descripcioncompleta, disponible, revisor, duenio)
            VALUES ('Mansión en Miami', 'Espectacular mansión de 5 habitaciones frente al mar, seguridad 24hs.', 'si', $1, $2)
            RETURNING identificador;
        `, [adminId, duenioId]);
        const productoId = productoRes.rows[0].identificador;

        // 5. Insertar ItemCatálogo
        await client.query(`
            INSERT INTO itemscatalogo (preciobase, comision, subastado, catalogo, producto)
            VALUES (2500000.00, 375000.00, 'no', $1, $2);
        `, [catalogoId, productoId]);

        // 6. Insertar Foto
        const imgUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600";
        await client.query(`
            INSERT INTO fotos (foto, producto)
            VALUES (convert_to($1, 'UTF8'), $2);
        `, [imgUrl, productoId]);

        console.log("✅ ¡Subasta Platino creada con éxito!");
        console.log("ID de la Subasta:", subastaId);
        console.log("Hora programada (UTC):", hora);
        
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

run();
