const fs = require('fs');
const xml = fs.readFileSync('info-de-mas/endpoints_docx/word/document.xml', 'utf8');

// Remove all XML tags, keeping only text content
// First, extract text between w:t tags only  
const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
let match;
let texts = [];
let lastWasSpace = false;

while (match = re.exec(xml)) {
  let text = match[1];
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  if (text.trim()) {
    texts.push(text);
    lastWasSpace = false;
  }
}

let output = texts.join(' ');
// Clean up multiple spaces
output = output.replace(/\s+/g, ' ');

fs.writeFileSync('info-de-mas/endpoints_clean.txt', output, 'utf8');
console.log('Done! Length:', output.length);
console.log('\n--- First 8000 chars ---\n');
console.log(output.substring(0, 8000));
