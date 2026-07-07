const fs = require('fs');
const buffer = fs.readFileSync('images/exercises/WALL PUSH-UP.png');
// Very naive check: just look at the first few bytes. Actually we can just run python to read the image and check if it has alpha channel, or just use a python script with PIL.
