const fs = require('fs');
const html = fs.readFileSync('public/dashboard.html', 'utf8');
const lines = html.split('\n');

for (let i = 1000; i <= 1050; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Look for unexpected )
    let inString = false;
    let quoteChar = null;
    let parens = 0;
    
    for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (inString) {
            if (c === quoteChar) inString = false;
        } else {
            if (c === '"' || c === "'") {
                inString = true;
                quoteChar = c;
            } else if (c === '(') {
                parens++;
            } else if (c === ')') {
                parens--;
                if (parens < 0) {
                    console.log('UNEXPECTED ) AT LINE', i + 1, 'COL', j, line);
                    parens = 0; // reset
                }
            }
        }
    }
}
