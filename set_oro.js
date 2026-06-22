const { Client } = require('pg'); 
const client = new Client({ user: 'postgres', host: 'localhost', database: 'postgres', password: '', port: 5432 }); 
client.connect().then(() => client.query("UPDATE clientes SET categoria = 'oro' WHERE identificador IN (SELECT cliente_identificador FROM usuarios WHERE email = 'oro@sello.com')")).then(res => console.log('Updated:', res.rowCount)).catch(console.error).finally(() => client.end());
