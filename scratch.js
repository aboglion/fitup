const fs = require('fs');

const data = fs.readFileSync('training_data.json');
const obj = JSON.parse(data);
const exercises = new Set();
obj.forEach(row => {
    Object.keys(row).forEach(k => {
        if (k.endsWith('Exercise') && row[k]) {
            exercises.add(row[k]);
        }
    });
});
console.log(Array.from(exercises).sort().join('\n'));
