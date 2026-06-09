// Training Engine - Smart day detection, XP, level progression
const TrainingEngine = {
  CYCLE: ['day1','day2','day3','rest','day5','rest'],
  
  getProgress() {
    const p = JSON.parse(localStorage.getItem('fitpro_progress') || 'null');
    return p || { xp: 0, rank: 'מתחיל', streak: 0, totalWorkouts: 0, muscleLevels: {}, workoutHistory: [], lastWorkoutDate: null };
  },
  
  saveProgress(p) { localStorage.setItem('fitpro_progress', JSON.stringify(p)); },

  // Determine today's training day based on history
  getTodayPlan() {
    const p = this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    
    // If already trained today
    if (p.lastWorkoutDate === today) {
      return { type: 'done', message: '✅ כבר התאמנת היום! מנוחה חשובה.' };
    }

    // Count consecutive training days
    const history = p.workoutHistory || [];
    let consecutiveDays = 0;
    const d = new Date();
    for (let i = 1; i <= 5; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const dateStr = check.toISOString().split('T')[0];
      if (history.find(h => h.date === dateStr)) consecutiveDays++;
      else break;
    }

    // After 3 consecutive days → rest
    if (consecutiveDays >= 3) {
      return { type: 'rest', message: '😴 יום מנוחה! התאמנת 3 ימים רצופים. הגוף צריך להתאושש.' };
    }

    // Find next day in cycle
    const lastDayId = history.length > 0 ? history[history.length - 1].dayId : null;
    let nextIdx = 0;
    if (lastDayId) {
      const lastIdx = this.CYCLE.indexOf(lastDayId);
      nextIdx = (lastIdx + 1) % this.CYCLE.length;
    }
    
    // Skip rest days in cycle
    while (this.CYCLE[nextIdx] === 'rest') {
      nextIdx = (nextIdx + 1) % this.CYCLE.length;
    }

    return { type: 'workout', dayId: this.CYCLE[nextIdx] };
  },

  // Get current level for a muscle group
  getMuscleLevel(muscleId) {
    const p = this.getProgress();
    return p.muscleLevels[muscleId] || 0; // index into exercises array
  },

  // Get current exercise for a muscle (only the unlocked one)
  getCurrentExercise(muscle) {
    const levelIdx = this.getMuscleLevel(muscle.id);
    const idx = Math.min(levelIdx, muscle.exercises.length - 1);
    return { exercise: muscle.exercises[idx], levelIndex: idx, isMaxLevel: idx >= muscle.exercises.length - 1 };
  },

  // Award XP
  addXP(amount, reason) {
    const p = this.getProgress();
    p.xp = (p.xp || 0) + amount;
    // Update rank
    if (p.xp >= 5000) p.rank = 'אלוף';
    else if (p.xp >= 2500) p.rank = 'מתקדם';
    else if (p.xp >= 1000) p.rank = 'ביניים';
    else if (p.xp >= 300) p.rank = 'חניך';
    else p.rank = 'מתחיל';
    this.saveProgress(p);
    return p.xp;
  },

  // Calculate XP for a set
  calcSetXP(reps, targetMax, strict, rir) {
    let xp = 10; // base
    if (reps >= targetMax) xp += 5; // hit max reps
    if (strict) xp += 3;
    if (rir >= 1 && rir <= 2) xp += 2; // good RIR range
    return xp;
  },

  // Check if ready for level up
  checkLevelUp(muscleId, exercise, setsData) {
    const targetReps = parseInt(exercise.reps.split('-').pop()) || 10;
    const targetSets = parseInt(exercise.sets) || 3;
    
    if (setsData.length < targetSets) return false;
    
    return setsData.every(s => 
      s.reps >= targetReps && s.strict && s.rir >= 1
    );
  },

  // Level up a muscle
  levelUp(muscleId) {
    const p = this.getProgress();
    const current = p.muscleLevels[muscleId] || 0;
    p.muscleLevels[muscleId] = current + 1;
    this.saveProgress(p);
    this.addXP(50, 'level_up');
    return current + 1;
  },

  // Record completed workout
  recordWorkout(dayId, dayName, duration, exerciseLogs) {
    const p = this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    p.lastWorkoutDate = today;
    p.totalWorkouts = (p.totalWorkouts || 0) + 1;
    
    // Streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const hadYesterday = (p.workoutHistory || []).find(h => h.date === yStr);
    p.streak = hadYesterday ? (p.streak || 0) + 1 : 1;
    
    if (!p.workoutHistory) p.workoutHistory = [];
    p.workoutHistory.push({ date: today, dayId, dayName, duration, logs: exerciseLogs });
    
    // Keep last 60 entries
    if (p.workoutHistory.length > 60) p.workoutHistory = p.workoutHistory.slice(-60);
    
    this.addXP(25, 'workout_complete');
    this.saveProgress(p);
    return p;
  },

  // Get weekly calendar status
  getWeekStatus() {
    const p = this.getProgress();
    const week = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const workout = (p.workoutHistory || []).find(h => h.date === dateStr);
      week.push({
        name: dayNames[i],
        date: dateStr,
        isToday: dateStr === today.toISOString().split('T')[0],
        completed: !!workout,
        dayName: workout ? workout.dayName : null
      });
    }
    return week;
  },

  getRankEmoji() {
    const p = this.getProgress();
    if (p.xp >= 5000) return '👑';
    if (p.xp >= 2500) return '🏆';
    if (p.xp >= 1000) return '⭐';
    if (p.xp >= 300) return '🔥';
    return '🌱';
  },

  getNextRankXP() {
    const p = this.getProgress();
    if (p.xp >= 5000) return 5000;
    if (p.xp >= 2500) return 5000;
    if (p.xp >= 1000) return 2500;
    if (p.xp >= 300) return 1000;
    return 300;
  }
};
