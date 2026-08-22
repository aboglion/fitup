const fs = require('fs');

// Read data.js and extract exercise names
const dataJs = fs.readFileSync('js/data.js', 'utf8');
const lines = dataJs.split('\n');
const exercises = new Set();
for (const line of lines) {
    if (line.includes('"name":')) {
        const match = line.match(/"name":\s*"([^"]+)"/);
        if (match) exercises.add(match[1]);
    }
}

// Check images/exercises/
const images = fs.readdirSync('images/exercises/').map(f => f.toLowerCase());
const missingImages = [];
for (const ex of exercises) {
    const pngName = ex.toLowerCase() + '.png';
    const jpgName = ex.toLowerCase() + '.jpg';
    if (!images.includes(pngName) && !images.includes(jpgName)) {
        missingImages.push(ex);
    }
}

// Check images/gifs/
const gifs = fs.readdirSync('images/gifs/').map(f => f.toLowerCase());
const missingGifs = [];
for (const ex of exercises) {
    const gifName = ex.toLowerCase() + '.gif';
    if (!gifs.includes(gifName)) {
        missingGifs.push(ex);
    }
}

console.log('Missing Images:', missingImages);
console.log('Missing GIFs:', missingGifs);
