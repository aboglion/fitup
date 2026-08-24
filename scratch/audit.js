const fs = require('fs');
const path = require('path');

// Mock browser environment globals if needed by files
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};

// Load data.js
require('/home/uns/fitup/js/data.js');
require('/home/uns/fitup/js/progression.js');

const data = window.TRAININGDATA;
const engine = new ProgressionEngine(data.progressionSettings);

console.log("TRAININGDATA Loaded.");
console.log("Version:", data.version);
console.log("Exercises count:", data.exercises.length);
console.log("Daily schedules count:", data.daily.length);

// Let's audit exercises defined in UPDATE_PROGRAM.md vs js/data.js
const exercisesMap = {};
data.exercises.forEach(ex => {
  exercisesMap[ex.id] = ex;
});

console.log("\n--- EXERCISES IN DATA.JS ---");
Object.keys(exercisesMap).forEach(id => {
  console.log(`- ${id} (${exercisesMap[id].name})`);
});
