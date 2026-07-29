const fs = require('fs');

const dataRaw = JSON.parse(fs.readFileSync('training_data.json'));
const exercises = new Set();
if (dataRaw.daily && Array.isArray(dataRaw.daily)) {
    dataRaw.daily.forEach(row => {
        Object.keys(row).forEach(k => {
            if (k.endsWith('Exercise') && row[k]) {
                exercises.add(row[k]);
            }
        });
    });
}

const exercisesCode = fs.readFileSync('js/exercises.js', 'utf8');
const regex = /name:\s*['"]([^'"]+)['"]/g;
let match;
while ((match = regex.exec(exercisesCode)) !== null) {
    exercises.add(match[1]);
}

const allExercises = Array.from(exercises).sort();

function getEquipment(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    
    if (n.includes('band') || n.includes('pallof') || n.includes('face pull') || n.includes('woodchop')) return 'גומיית התנגדות';
    if (n.includes('wall')) return 'קיר פנוי';
    if (n.includes('bench dip') || n.includes('step-up') || n.includes('bulgarian') || n.includes('incline') || n.includes('decline') || n.includes('copenhagen') || n.includes('chair') || n.includes('elevated') || n.includes('table')) return 'כיסא / ספסל';
    if (n.includes('hamstring curl') || n.includes('hamstring towel curl')) return 'מגבת קטנה';
    if (n.includes('towel') || n.includes('hang') || n.includes('pull-up') || n.includes('inverted row') || n.includes('chin-up') || n.includes('hanging') || n.includes('front lever')) return 'מתח / מקבילים';
    if (n.includes('couch stretch')) return 'קיר + כרית';
    if (n.includes('foam roll')) return 'גליל עיסוי';
    
    return 'משקל גוף בלבד';
}

const table = {};
allExercises.forEach(ex => {
    table[ex] = getEquipment(ex);
});

console.log(JSON.stringify(table, null, 2));
