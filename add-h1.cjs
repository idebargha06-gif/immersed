const fs = require('fs');

// Read index.html
let content = fs.readFileSync('index.html', 'utf8');

// Add h1 tag after <body>
const h1Tag = '<h1 style="position:absolute; left:-9999px;">Immersed – Focus Better, Together</h1>\n  ';
content = content.replace('<body>', '<body>\n  ' + h1Tag);

// Write back
fs.writeFileSync('index.html', content);
console.log('H1 tag added successfully');
