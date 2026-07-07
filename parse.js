const fs = require('fs');
const data = JSON.parse(fs.readFileSync('training_data.json', 'utf8'));

const unlocks = {};
data.forEach(day => {
  if(!day["שבוע"]) return;
  const weekNum = parseInt(day["שבוע"].replace('שבוע ', ''));
  for (let key in day) {
    if (key.endsWith(' - תרגיל')) {
      const exName = day[key];
      if (exName && exName !== '—') {
        if (!unlocks[exName]) {
          unlocks[exName] = weekNum;
        } else {
          unlocks[exName] = Math.min(unlocks[exName], weekNum);
        }
      }
    }
  }
});

console.log(JSON.stringify(unlocks, null, 2));
