const { Client } = require('pg');

const client = new Client({
    connectionString: "postgres://postgres.rveowknhrsvikdizudof:19176378matias@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function insertDemoData() {
    try {
        await client.connect();
        console.log("Connected to Supabase DB");

        // We need:
        // 1 Persona
        const resPersona = await client.query(`INSERT INTO personas (documento, nombre, direccion, estado) VALUES ('12345678', 'Admin Demo', 'Calle Falsa 123', 'activo') RETURNING identificador`);
        const pId = resPersona.rows[0].identificador;

        // 1 Empleado
        await client.query(`INSERT INTO empleados (identificador, cargo, sector) VALUES ($1, 'Gerente', null)`, [pId]);

        // 1 Duenio
        await client.query(`INSERT INTO duenios (identificador, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador) VALUES ($1, 'si', 'si', 5, $1)`, [pId]);

        // 1 Subastador
        await client.query(`INSERT INTO subastadores (identificador, matricula, region) VALUES ($1, 'MAT123', 'Norte')`, [pId]);

        // 1 Subasta
        const resSubasta = await client.query(`INSERT INTO subastas (fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria) VALUES (CURRENT_DATE, CURRENT_TIME, 'abierta', $1, 'Virtual', 100, 'si', 'si', 'comun') RETURNING identificador`, [pId]);
        const sId = resSubasta.rows[0].identificador;

        // 2 Productos
        const resProd1 = await client.query(`INSERT INTO productos (fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES (CURRENT_DATE, 'si', 'Reloj Rolex Vintage', 'Reloj Rolex Submariner de 1980 en excelente estado', $1, $1, null) RETURNING identificador`, [pId]);
        const prId1 = resProd1.rows[0].identificador;

        const resProd2 = await client.query(`INSERT INTO productos (fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES (CURRENT_DATE, 'si', 'Pintura Picasso', 'Copia autorizada de pintura famosa', $1, $1, null) RETURNING identificador`, [pId]);
        const prId2 = resProd2.rows[0].identificador;

        // 1 Catalogo
        const resCat = await client.query(`INSERT INTO catalogos (descripcion, subasta, responsable) VALUES ('Catálogo de Lujo', $1, $2) RETURNING identificador`, [sId, pId]);
        const cId = resCat.rows[0].identificador;

        // 2 Items Catalogo
        await client.query(`INSERT INTO itemsCatalogo (catalogo, producto, precioBase, comision, subastado) VALUES ($1, $2, 5000.00, 500.00, 'no')`, [cId, prId1]);
        await client.query(`INSERT INTO itemsCatalogo (catalogo, producto, precioBase, comision, subastado) VALUES ($1, $2, 25000.00, 2500.00, 'no')`, [cId, prId2]);

        // Add Fotos (using placeholders)
        const url1 = "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=400";
        const url2 = "https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?q=80&w=400";
        
        await client.query(`INSERT INTO fotos (producto, foto) VALUES ($1, convert_to($2, 'UTF8'))`, [prId1, url1]);
        await client.query(`INSERT INTO fotos (producto, foto) VALUES ($1, convert_to($2, 'UTF8'))`, [prId2, url2]);

        console.log("Demo data inserted successfully!");
    } catch(err) {
        console.error("Error inserting data:", err);
    } finally {
        await client.end();
    }
}

insertDemoData();
