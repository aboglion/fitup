const fs = require('fs');

// Read data
const exercisesJS = fs.readFileSync('/home/uns/fitup/js/exercises.js', 'utf8');
const dataJS = fs.readFileSync('/home/uns/fitup/js/data.js', 'utf8');

// Extract EXERCISE_GIF_ALIASES and EXERCISE_PNG_ALIASES from ui.js
const uiJS = fs.readFileSync('/home/uns/fitup/js/ui.js', 'utf8');
let gifAliases = {};
let pngAliases = {};
try {
  const gifMatch = uiJS.match(/const EXERCISE_GIF_ALIASES = ({[\s\S]*?});/);
  if (gifMatch) {
    gifAliases = eval('(' + gifMatch[1] + ')');
  }
  const pngMatch = uiJS.match(/const EXERCISE_PNG_ALIASES = ({[\s\S]*?});/);
  if (pngMatch) {
    pngAliases = eval('(' + pngMatch[1] + ')');
  }
} catch (e) {
  console.log("Error parsing aliases");
}

// Extract SKILL_TREES from exercises.js
const exercises = [];
const exerciseRegex = /{ name: '([^']+)', unlockWeek: (\d+).*?}/g;
let match;
while ((match = exerciseRegex.exec(exercisesJS)) !== null) {
  const name = match[1];
  const unlockWeek = parseInt(match[2]);
  let difficulty = 'Beginner';
  if (unlockWeek > 26) difficulty = 'Advanced';
  else if (unlockWeek > 5) difficulty = 'Intermediate';
  
  if (!exercises.find(e => e.name === name)) {
    exercises.push({ name, unlockWeek, difficulty });
  }
}

// Parse data.js to find program location
let trainingData = null;
try {
  // Extract just the JSON part
  const match = dataJS.match(/window\.TRAINING_DATA = ({.*});?/s);
  if (match) {
    trainingData = JSON.parse(match[1]);
  }
} catch(e) {
  console.log("Error parsing training data:", e.message);
}

if (trainingData) {
  exercises.forEach(ex => {
    let firstFound = null;
    for (const day of trainingData.daily) {
      if (!day.exercises) continue;
      for (const e of day.exercises) {
        if (e.name === ex.name || e.id === ex.name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
          firstFound = `Week ${day.week.replace('Week ', '')} Day ${day.dayNum} (${day.dayType})`;
          break;
        }
      }
      if (firstFound) break;
    }
    ex.programLocation = firstFound || 'Not found in plan';
  });
}

// Check Images and GIFs
function hasGif(name) {
    const cleanTitle = name.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    if (gifAliases[cleanTitle]) return `✅ ${gifAliases[cleanTitle]}`;
    const path = `/home/uns/fitup/images/gifs/${name}.gif`;
    if (fs.existsSync(path)) return `✅ ${name}.gif`;
    return `❌ Missing`;
}

function hasPng(name) {
    const cleanTitle = name.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    if (pngAliases[cleanTitle]) return `✅ ${pngAliases[cleanTitle]}`;
    const path = `/home/uns/fitup/images/exercises/${name.replace(/\//g, '-').toUpperCase()}.png`;
    if (fs.existsSync(path)) return `✅ ${name.replace(/\//g, '-').toUpperCase()}.png`;
    return `❌ Missing`;
}

exercises.forEach(ex => {
    ex.gifStatus = hasGif(ex.name);
    ex.pngStatus = hasPng(ex.name);
});

// Print markdown table
console.log("| שם התרגיל | גיף | תמונה | דרגת קושי | שבוע פתיחה | מיקום בתוכנית (פעם ראשונה) |");
console.log("|---|---|---|---|---|---|");
exercises.forEach(ex => {
    console.log(`| ${ex.name} | ${ex.gifStatus} | ${ex.pngStatus} | ${ex.difficulty} | ${ex.unlockWeek} | ${ex.programLocation} |`);
});
