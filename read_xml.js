const fs = require('fs');
const xml = fs.readFileSync('c:\\Users\\Mati\\Downloads\\SubastasYa-TPO-main\\SubastasYa-TPO-main\\info-de-mas\\endpoints_docx\\word\\document.xml', 'utf8');
const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
console.log(text);
