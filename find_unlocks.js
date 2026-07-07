const fs = require('fs');
const data = JSON.parse(fs.readFileSync('js/data.js').toString().replace('window.TRAINING_DATA = ', ''));

const unlocks = {};
data.daily.forEach(day => {
  const weekNum = parseInt(day.week.replace('שבוע ', ''));
  day.exercises.forEach(ex => {
    if (!ex.name) return;
    if (!unlocks[ex.name]) {
      unlocks[ex.name] = weekNum;
    } else {
      unlocks[ex.name] = Math.min(unlocks[ex.name], weekNum);
    }
  });
});

console.log(JSON.stringify(unlocks, null, 2));
