const fs = require('fs');

const DB = {
  getAllPlan: async () => {
    return window.TRAINING_DATA.daily.map((day, idx) => ({
      dayIndex: idx,
      ...day
    }));
  },
  getExerciseGuide: async () => {
    return window.TRAINING_DATA.exercises;
  }
};

global.DB = DB;
global.window = {};

const data = fs.readFileSync('js/data.js', 'utf8');
eval(data);

const script = fs.readFileSync('js/export-guide.js', 'utf8');
eval(script);

(async () => {
  try {
    const html = await window.ExporterGuide.generateProgramGuide();
    console.log("SUCCESS, HTML Length:", html.length);
  } catch (e) {
    console.error("ERROR:", e);
  }
})();
