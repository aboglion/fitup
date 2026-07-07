const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./training_data.json', 'utf8'));

data.daily.forEach(day => {
  if (day["סוג יום"] !== "כוח" && day["סוג יום"] !== "הליכה") return;
  
  // Helper to replace exercise and update sets/reps
  const replaceExercise = (oldName, newName, newSetsReps) => {
    Object.keys(day).forEach(key => {
      if (key.includes("תרגיל") && day[key] === oldName) {
        day[key] = newName;
        const prefix = key.split(" - ")[0]; // e.g., "A1"
        if (day[`${prefix} - סטים×חזרות`]) {
          day[`${prefix} - סטים×חזרות`] = newSetsReps;
        }
      }
    });
  };

  // Replace Wall Push-up -> Incline Push-up
  replaceExercise("Wall Push-up", "Incline Push-up", "3×8-12");

  // Replace Box Squat -> Squat איטי
  replaceExercise("Box Squat", "Squat איטי", "3×10-12");

  // Replace Active Hang -> Scapular Pull-up
  replaceExercise("Active Hang", "Scapular Pull-up", "2×10-15");

  // Replace Superman / Back Extension -> Bird-Dog
  replaceExercise("Superman / Back Extension", "Bird-Dog", "3×10 לכל צד");

  // Replace Banded GM -> Banded Hip Thrust
  replaceExercise("Banded GM", "Banded Hip Thrust", "3×12-15");

  // Replace Dead Bug -> Hollow Body Hold (on strength days)
  if (day["סוג יום"] === "כוח") {
     replaceExercise("Dead Bug", "Hollow Body Hold", "3×20-30 שניות");
  }
});

fs.writeFileSync('./training_data.json', JSON.stringify(data, null, 2));
console.log("Updated training_data.json successfully.");
