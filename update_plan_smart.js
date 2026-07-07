const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./training_data.json', 'utf8'));

data.daily.forEach(day => {
  const weekNum = parseInt(day["שבוע"].replace("שבוע ", ""), 10);
  
  // Helper to get prefix for an exercise
  const findPrefix = (exName) => {
    for (let key of Object.keys(day)) {
      if (key.includes("תרגיל") && day[key] === exName) {
        return key.split(" - ")[0];
      }
    }
    return null;
  };

  const replaceWithProgression = (oldName, newName, setsRepsFunc) => {
    const prefix = findPrefix(oldName);
    if (prefix) {
      day[`${prefix} - תרגיל`] = newName;
      day[`${prefix} - סטים×חזרות`] = setsRepsFunc(weekNum, day[`${prefix} - סטים×חזרות`]);
    }
  };

  // 1. Wall Push-up -> Incline Push-up
  // Original was 2x8-12 -> 3x12 etc.
  replaceWithProgression("Wall Push-up", "Incline Push-up", (w, orig) => {
    if (w <= 4) return "2×6-10";
    if (w <= 8) return "3×8-12";
    return orig.replace("12", "12-15"); // fallback
  });

  // 2. Box Squat -> Squat איטי
  // Original was 3x10-12
  replaceWithProgression("Box Squat", "Squat איטי", (w, orig) => {
    if (w <= 4) return "3×8-10";
    if (w <= 8) return "3×10-12";
    return orig;
  });

  // 3. Active Hang -> Scapular Pull-up
  // Original was in seconds (2x25-45 sec)
  replaceWithProgression("Active Hang", "Scapular Pull-up", (w, orig) => {
    if (w <= 4) return "2×8-12";
    if (w <= 8) return "3×8-12";
    if (w <= 12) return "3×10-15";
    return "3×10-15";
  });

  // 4. Superman / Back Extension -> Bird-Dog
  replaceWithProgression("Superman / Back Extension", "Bird-Dog", (w, orig) => {
    if (w <= 8) return "3×8 לכל צד";
    return "3×10 לכל צד";
  });

  // 5. Reverse Snow Angel -> Bird-Dog
  replaceWithProgression("Reverse Snow Angel", "Bird-Dog", (w, orig) => {
    if (w <= 8) return "3×8 לכל צד";
    return "3×10 לכל צד";
  });

  // 6. Banded GM -> Banded Hip Thrust
  // Original was 3x10-12
  replaceWithProgression("Banded GM", "Banded Hip Thrust", (w, orig) => {
    return orig; // Original progression for Banded GM fits Hip Thrust perfectly
  });

  // 7. Dead Bug -> Hollow Body Hold (only on strength days if we want, but Dead Bug is 2x5)
  // Let's replace Dead Bug with Hollow Body Hold completely but adjust reps to seconds.
  replaceWithProgression("Dead Bug", "Hollow Body Hold", (w, orig) => {
    if (w <= 4) return "2×20 שניות";
    if (w <= 8) return "3×20 שניות";
    if (w <= 16) return "3×30 שניות";
    return "3×30 שניות";
  });
});

fs.writeFileSync('./training_data.json', JSON.stringify(data, null, 2));
console.log("Updated training_data.json successfully with smart progression.");
