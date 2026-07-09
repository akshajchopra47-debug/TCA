const fs = require('fs');
const html = fs.readFileSync('public/dashboard.html', 'utf8');

const regex = /on[a-z]+="([^"]+)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
    const code = match[1];
    try {
        // try to parse it
        new Function(code);
    } catch (e) {
        console.log('SYNTAX ERROR IN INLINE HANDLER:', code);
        console.log(e.message);
    }
}
