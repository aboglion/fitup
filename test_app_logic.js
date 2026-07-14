const fs = require('fs');
const allPlanDays = JSON.parse(fs.readFileSync('training_data.json', 'utf-8')).daily.map((day, idx) => ({
  dayIndex: idx,
  dayNum: day.Day.replace('Day ', ''),
  dayOfWeek: day['Day of Week'],
  dayType: day['Day Type']
}));

// mock DB
const allTracking = [];
let planStartDateStr = null;

let planIndex = 0;
for (let i = 0; i < allPlanDays.length; i++) {
  const track = allTracking.find(t => t.dayIndex === i);
  if (!track || !track.completed) {
    planIndex = i;
    break;
  }
}

console.log("Initial planIndex:", planIndex);

if (planStartDateStr) {
  // auto-skip logic ...
}

console.log("Final planIndex:", planIndex);

// updatePlanDaysDates
const today = new Date();
const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const activeIndex = planIndex;

const baseDate = new Date();
if (!planStartDateStr) {
  const currentDay = baseDate.getDay();
  baseDate.setDate(baseDate.getDate() - currentDay);
}

const firstDays = allPlanDays.slice(0, 3);
firstDays.forEach(day => {
  let d = new Date();
  if (!planStartDateStr) {
    d = new Date(baseDate);
    d.setDate(baseDate.getDate() + day.dayIndex);
  } else {
    d = new Date(today);
    d.setDate(today.getDate() + (day.dayIndex - activeIndex));
  }
  day.newDayOfWeek = dayNames[d.getDay()];
});

console.log("Days mapped:", firstDays);
