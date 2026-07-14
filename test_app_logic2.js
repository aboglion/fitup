const fs = require('fs');
const allPlanDays = JSON.parse(fs.readFileSync('training_data.json', 'utf-8')).daily.map((day, idx) => ({
  dayIndex: idx,
  dayNum: day.Day.replace('Day ', ''),
  dayOfWeek: day['Day of Week'],
  dayType: day['Day Type']
}));

let planStartDateStr = null;
let planIndex = 0;

const today = new Date();
const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const activeIndex = planIndex;

const baseDate = new Date();
if (!planStartDateStr) {
  const currentDay = baseDate.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  baseDate.setDate(baseDate.getDate() - diffToMonday);
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
