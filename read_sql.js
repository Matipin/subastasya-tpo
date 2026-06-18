const fs = require('fs');
const path = require('path');
const sqlPath = path.join('c:\\Users\\Mati\\Downloads\\SubastasYa-TPO-main\\SubastasYa-TPO-main\\info-de-mas', 'EstructuraActual.sql');
console.log(fs.readFileSync(sqlPath, 'utf8'));
