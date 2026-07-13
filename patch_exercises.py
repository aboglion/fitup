import re

with open('js/exercises.js', 'r', encoding='utf-8') as f:
    content = f.read()

tabs_pattern = r'const DAY_TABS = \[.*?\];'
new_tabs = """const DAY_TABS = [
    { id: 'lower-strength', label: 'Lower Strength', subtitle: 'Legs · Core', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><circle cx="12" cy="4" r="2"/><path d="M12 6v10M6 5v5h12V5M12 16l-4 6M12 16l4 6"/></svg>', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', dayTypes: ['Lower Strength'] },
    { id: 'upper-push', label: 'Upper Push', subtitle: 'Chest · Shoulders', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M12 6v14M6 5v5h12V5M9 20h6"/></svg>', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', dayTypes: ['Upper Push'] },
    { id: 'upper-pull', label: 'Upper Pull', subtitle: 'Back · Arms · Skill', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><circle cx="12" cy="4" r="2"/><path d="M12 6v10M6 5v5h12V5M12 16l-4 6M12 16l4 6"/></svg>', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', dayTypes: ['Upper Pull + Skill'] },
    { id: 'cardio', label: 'Cardio', subtitle: 'Active Recovery', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', dayTypes: ['Active Recovery'] }
  ];"""

content = re.sub(tabs_pattern, new_tabs, content, flags=re.DOTALL)

tree_pattern = r'const SKILL_TREES = \{.*?\n  \};\n'
new_trees = """const SKILL_TREES = {
    'lower-strength': [
      {
        title: '🔥 Warmup', icon: '🛡️', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }
        ]
      },
      {
        title: '🦵 Legs', icon: '🏋️', exercises: [
          { name: 'Bodyweight Squat', unlockWeek: 1 }, { name: 'Reverse Lunge', unlockWeek: 1, parallel: true }, { name: 'Split Squat', unlockWeek: 4 }, { name: 'Bodyweight Single-Leg RDL', unlockWeek: 7 }, { name: 'Single-Leg RDL', unlockWeek: 10 }, { name: 'Hamstring Towel Curl', unlockWeek: 10, parallel: true }, { name: 'Bulgarian Split Squat', unlockWeek: 13 }, { name: 'Banded Single-Leg RDL', unlockWeek: 16 }, { name: 'Wall-Supported Skater Squat', unlockWeek: 19 }, { name: 'Pistol Squat to Chair', unlockWeek: 25 }, { name: 'Full Pistol Squat', unlockWeek: 28 }
        ]
      },
      {
        title: '🍑 Glutes & Calves', icon: '🔥', exercises: [
          { name: 'Single-Leg Glute Bridge', unlockWeek: 1 }, { name: 'Banded Glute Bridge', unlockWeek: 13 }, { name: 'Calf Raise', unlockWeek: 1, parallel: true }, { name: 'Single-Leg Calf Raise', unlockWeek: 4, parallel: true }
        ]
      },
      {
        title: '🧱 Core', icon: '🔲', exercises: [
          { name: 'Dead Bug', unlockWeek: 1 }, { name: 'Hollow Body Rock', unlockWeek: 4 }, { name: 'Hollow-to-Arch Rock', unlockWeek: 10 }, { name: 'L-sit on Chair', unlockWeek: 13 }, { name: 'L-sit on Floor', unlockWeek: 16 }, { name: 'Dragon Flag Negative', unlockWeek: 19 }, { name: 'Dragon Flag (Partial ROM)', unlockWeek: 22 }, { name: 'Dragon Flag', unlockWeek: 25 }
        ]
      }
    ],
    'upper-push': [
      {
        title: '🔥 Warmup', icon: '🛡️', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }
        ]
      },
      {
        title: '💥 Push (Chest)', icon: '🫁', exercises: [
          { name: 'Table Push-up', unlockWeek: 1 }, { name: 'Knee Push-up', unlockWeek: 1, parallel: true }, { name: 'Push-up', unlockWeek: 4 }, { name: 'Close-Grip Push-up', unlockWeek: 7 }, { name: 'Diamond Push-up', unlockWeek: 10 }, { name: 'Decline Push-up', unlockWeek: 13 }, { name: 'Archer Push-up', unlockWeek: 16 }, { name: 'One-Arm Push-up Lean', unlockWeek: 22 }, { name: 'Pseudo-Planche Lean', unlockWeek: 25 }
        ]
      },
      {
        title: '🎯 Shoulders', icon: '🏔️', exercises: [
          { name: 'Table Pike Push-up', unlockWeek: 1 }, { name: 'Pike Push-up', unlockWeek: 4 }, { name: 'Elevated Pike Push-up', unlockWeek: 7 }, { name: 'Wall Handstand', unlockWeek: 10 }, { name: 'Partial Wall Walk', unlockWeek: 13 }, { name: 'Wall Walk (Full)', unlockWeek: 16 }, { name: 'Handstand Push-up Negative', unlockWeek: 19 }
        ]
      },
      {
        title: '🔗 Upper Back (Prehab)', icon: '↔️', exercises: [
          { name: 'Band Pull-Apart', unlockWeek: 1 }, { name: 'Prone Y-T-W', unlockWeek: 1, parallel: true }
        ]
      }
    ],
    'upper-pull': [
      {
        title: '🔥 Warmup', icon: '🛡️', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }
        ]
      },
      {
        title: '🧲 Vertical Pull', icon: '⬆️', exercises: [
          { name: 'Scapular Pull-up', unlockWeek: 1 }, { name: 'Dead Hang', unlockWeek: 1, parallel: true }, { name: 'Pull-up Negative', unlockWeek: 4 }, { name: 'Chin-up Negative', unlockWeek: 10 }, { name: 'Chin-up', unlockWeek: 13 }, { name: 'Pull-up (Overhand)', unlockWeek: 19 }, { name: 'Explosive Pull-up', unlockWeek: 25 }
        ]
      },
      {
        title: '💪 Arms & Grip', icon: '🦾', exercises: [
          { name: 'Band Curl', unlockWeek: 1 }, { name: 'Towel Grip Hang', unlockWeek: 7, parallel: true }
        ]
      },
      {
        title: '✨ Skill Practice', icon: '⭐', exercises: [
          { name: 'Handstand Practice', unlockWeek: 1 }, { name: 'L-sit Practice', unlockWeek: 13, parallel: true }
        ]
      },
      {
        title: '🧱 Core', icon: '🔲', exercises: [
          { name: 'Side Plank Hip Dip', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }, { name: 'Hollow Body Rock', unlockWeek: 4 }, { name: 'Hollow-to-Arch Rock', unlockWeek: 10 }, { name: 'L-sit on Chair', unlockWeek: 13 }, { name: 'L-sit on Floor', unlockWeek: 16 }, { name: 'Dragon Flag Negative', unlockWeek: 19 }, { name: 'Dragon Flag (Partial ROM)', unlockWeek: 22 }, { name: 'Dragon Flag', unlockWeek: 25 }
        ]
      }
    ],
    'cardio': [
      {
        title: '🫀 Active Recovery', icon: '🏃‍♂️', exercises: [
          { name: 'Relaxed Walking', unlockWeek: 1 }, { name: 'Brisk Walking', unlockWeek: 1 }
        ]
      }
    ]
  };
"""

content = re.sub(tree_pattern, new_trees, content, flags=re.DOTALL)

with open('js/exercises.js', 'w', encoding='utf-8') as f:
    f.write(content)
