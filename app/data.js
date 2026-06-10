// Workout Training Program Data
const WORKOUT_DATA = {
  days: [
    {
      id: "day1",
      name: "יום 1 – PUSH",
      subtitle: "חזה, כתפיים, טרייספס",
      emoji: "💪",
      folder: "day1",
      muscles: [
        {
          id: "d1m1", name: "Push-Up Chain", nameHe: "חזה", image: "m1.png",
          exercises: [
            { id:"d1m1e1", name:"Push-Up", level:"green", image:"m1_1.png", video:"https://musclewiki.com/exercise/push-up?model=m", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m1e2", name:"Decline Push-Up", level:"blue", image:"m1_2.png", video:"https://musclewiki.com/exercise/decline-push-up?model=m", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m1e3", name:"Archer Push-Up", level:"orange", image:"m1_3.png", video:"https://www.youtube.com/watch?v=25t7UBYCMbE", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m1e4", name:"One-Arm Push-Up Progression", level:"red", image:"m1_4.png", video:"https://www.youtube.com/watch?v=xp1tgjT_3k0", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d1m2", name: "Shoulders", nameHe: "כתפיים", image: "m2.png",
          exercises: [
            { id:"d1m2e1", name:"Pike Push-Up", level:"green", image:"m2_1.png", video:"https://www.youtube.com/watch?v=XckEEwa1BPI", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m2e2", name:"Elevated Pike Push-Up", level:"blue", image:"m2_2.png", video:"https://www.youtube.com/watch?v=8URA3YSur2M", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m2e3", name:"Wall Handstand Push-Up", level:"orange", image:"m2_3.png", video:"https://www.youtube.com/watch?v=gdhmNaZ7nAk", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🧱", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m2e4", name:"Freestanding HSPU", level:"red", image:"m2_4.png", video:"https://www.youtube.com/watch?v=aAErmRDDJKY", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d1m3", name: "Triceps", nameHe: "טרייספס", image: "m3.png",
          exercises: [
            { id:"d1m3e1", name:"Diamond Push-Up", level:"green", image:"m3_1.png", video:"https://www.youtube.com/shorts/PPTj-MW2tcs", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m3e2", name:"Slow Diamond Push-Up", level:"blue", image:"m3_2.png", video:"https://www.youtube.com/watch?v=-8cgTA3xPH8", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d1m3e3", name:"Decline Diamond Push-Up", level:"orange", image:"m3_3.png", video:"https://www.youtube.com/shorts/j3tWhdIgoMA", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"רמה מקסימלית" }
          ]
        }
      ]
    },
    {
      id: "day2",
      name: "יום 2 – PULL",
      subtitle: "גב, ביספס, בריאות כתף",
      emoji: "🧲",
      folder: "day2",
      muscles: [
        {
          id: "d2m1", name: "Vertical Pull", nameHe: "משיכה אנכית", image: "m1.png",
          exercises: [
            { id:"d2m1e1", name:"Negative Pull-Up", level:"green", image:"m1_1.png", video:"https://www.youtube.com/watch?v=3w8Pnbl70SQ", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🧗", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m1e2", name:"Pull-Up", level:"blue", image:"m1_2.png", video:"https://www.youtube.com/shorts/9rckBLbVe8c", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🧗", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m1e3", name:"Archer Pull-Up", level:"orange", image:"m1_3.png", video:"https://www.youtube.com/watch?v=Z7GdTkOEe5Y", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🧗", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m1e4", name:"Assisted One-Arm Pull-Up", level:"red", image:"m1_4.png", video:"https://www.youtube.com/shorts/yixCkor_peE", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🧗", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d2m2", name: "Horizontal Row", nameHe: "משיכה אופקית", image: "m2.png",
          exercises: [
            { id:"d2m2e1", name:"Australian Row", level:"green", image:"m2_1.png", video:"https://www.youtube.com/watch?v=hXTc1mDnZCw", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m2e2", name:"Feet Elevated Row", level:"blue", image:"m2_2.png", video:"https://www.youtube.com/shorts/Gpm1N98x0Ek", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m2e3", name:"Slow Tempo Row", level:"orange", image:"m2_3.png", video:"", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m2e4", name:"Chest-to-Bar Row", level:"red", image:"m2_4.png", video:"", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d2m3", name: "Biceps", nameHe: "ביספס", image: "m3.png",
          exercises: [
            { id:"d2m3e1", name:"Bodyweight Curl", level:"green", image:"m3_1.png", video:"https://www.youtube.com/shorts/7VC7smYfY0I", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🪑", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m3e2", name:"Slow Curl", level:"orange", image:"m3_2.png", video:"", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🪑", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d2m3e3", name:"Hold Row + Curl", level:"red", image:"m3_3.png", video:"", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d2m4", name: "Shoulder Health", nameHe: "בריאות כתף", image: "m4.png",
          exercises: [
            { id:"d2m4e1", name:"Dead Hang + Scapular Pull-Up", level:"green", image:"m4_1.png", video:"https://www.youtube.com/shorts/9eY15prKcUY", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", equipment:"🧗", progression:"60 שניות החזקה יציבה" }
          ]
        },
        {
          id: "d2m5", name: "Scapular Health", nameHe: "בריאות שכמה", image: "m5.png",
          exercises: [
            { id:"d2m5e1", name:"Scapular Pull-Up", level:"green", image:"m5_1.png", video:"https://www.youtube.com/shorts/K3NHuFdO5Zs", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🧗", progression:"3×15 בטכניקה מושלמת + RIR≥1" }
          ]
        }
      ]
    },
    {
      id: "day3",
      name: "יום 3 – LEGS",
      subtitle: "רגליים – כוח + שרשרת אחורית",
      emoji: "🦵",
      folder: "day3",
      muscles: [
        {
          id: "d3m1", name: "Quads", nameHe: "ארבע ראשי", image: "m1.png",
          exercises: [
            { id:"d3m1e1", name:"Split Squat", level:"green", image:"m1_1.png", video:"https://www.youtube.com/watch?v=SGHnCftrZkA", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"3×10 לכל רגל, יציב" },
            { id:"d3m1e2", name:"Bulgarian Split Squat", level:"blue", image:"m1_2.png", video:"https://musclewiki.com/exercise/bodyweight-bulgarian-split-squat?model=m", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", equipment:"🪑", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m1e3", name:"Pistol Squat to Chair", level:"orange", image:"m1_3.png", video:"https://www.youtube.com/watch?v=pistol-squat-to-chair-v1-1654704430.mp4", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"3×10 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m1e4", name:"Pistol Squat", level:"red", image:"m1_4.png", video:"https://musclewiki.com/exercise/bodyweight-single-leg-squat?model=m", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1", type:"compound", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d3m2", name: "Hamstrings", nameHe: "המסטרינג", image: "m2.png",
          exercises: [
            { id:"d3m2e1", name:"Sliding Leg Curl", level:"green", image:"m2_1.png", video:"https://www.youtube.com/shorts/oC4nmqHEmn8", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🧦", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m2e2", name:"Eccentric Nordic Curl", level:"orange", image:"m2_2.png", video:"https://www.youtube.com/watch?v=e17hjjvQLQQ", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🛏️", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m2e3", name:"Slow Nordic Curl", level:"red", image:"m2_3.png", video:"", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🛏️", progression:"רמה מקסימלית" },
            { id:"d3m2e4", name:"Full Nordic Curl", level:"red", image:"m2_4.png", video:"", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d3m3", name: "Glutes", nameHe: "ישבן", image: "m3.png",
          exercises: [
            { id:"d3m3e1", name:"Glute Bridge", level:"green", image:"m3_1.png", video:"https://musclewiki.com/exercise/glute-bridge?model=m", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m3e2", name:"Single-Leg Glute Bridge", level:"blue", image:"m3_2.png", video:"https://musclewiki.com/exercise/single-leg-glute-bridge?model=m", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m3e3", name:"Single-Leg Hip Thrust", level:"orange", image:"m3_3.png", video:"https://www.healthline.com/health/fitness/single-leg-hip-thrust", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🪑", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m3e4", name:"Weighted Hip Thrust", level:"red", image:"m3_4.png", video:"https://musclewiki.com/exercise/dumbbell-single-leg-hip-thrust?model=m", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", equipment:"🎒", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d3m4", name: "Calves", nameHe: "תאומים", image: "m4.png",
          exercises: [
            { id:"d3m4e1", name:"Double-Leg Calf Raise", level:"green", image:"m4_1.png", video:"https://www.youtube.com/watch?v=0oITrlcFByY", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m4e2", name:"Single-Leg Calf Raise", level:"blue", image:"m4_2.png", video:"https://www.youtube.com/watch?v=qPd73snQfUs", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m4e3", name:"Paused Calf Raise", level:"orange", image:"m4_3.png", video:"https://www.youtube.com/watch?v=Ju9epjz9h-w", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" },
            { id:"d3m4e4", name:"Slow Tempo Calf Raise", level:"red", image:"m4_4.png", video:"https://www.youtube.com/watch?v=mSH2PgRD8TE", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"רמה מקסימלית" }
          ]
        }
      ]
    },
    {
      id: "day5",
      name: "יום 5 – CORE + Cardio",
      subtitle: "ליבה + קרדיו Zone 2",
      emoji: "🫀",
      folder: "day5",
      muscles: [
        {
          id: "d5m1", name: "Zone 2 Cardio", nameHe: "קרדיו (חובה)", image: "m1.png",
          exercises: [
            { id:"d5m1e1", name:"Cycling / Walking / Light Running", level:"green", image:"m1_1.png", video:"", sets:"-", reps:"40-45 דקות", rest:"-", tempo:"-", type:"cardio", progression:"דופק שבו אפשר לדבר משפטים מלאים" }
          ]
        },
        {
          id: "d5m2", name: "Front Core", nameHe: "ליבה קדמית", image: "m2.png",
          exercises: [
            { id:"d5m2e1", name:"Dead Bug", level:"green", image:"m2_1.png", video:"https://www.youtube.com/shorts/5c-vucY3beU", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"60 שניות החזקה יציבה" },
            { id:"d5m2e2", name:"Leg Raise", level:"blue", image:"m2_2.png", video:"https://www.youtube.com/watch?v=3oIpxsn6FxQ", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"60 שניות החזקה יציבה" },
            { id:"d5m2e3", name:"Hollow Body Hold", level:"orange", image:"m2_3.png", video:"https://www.youtube.com/shorts/YHBp6fvXYcI", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"60 שניות החזקה יציבה" },
            { id:"d5m2e4", name:"L-Sit", level:"red", image:"m2_4.png", video:"https://www.youtube.com/watch?v=HxDP7SqggpI", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d5m3", name: "Side Core", nameHe: "ליבה צדדית", image: "m3.png",
          exercises: [
            { id:"d5m3e1", name:"Side Plank", level:"green", image:"m3_1.png", video:"https://www.youtube.com/watch?v=NQsqPcarPXY", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"60 שניות החזקה יציבה" },
            { id:"d5m3e2", name:"Side Plank Leg Raise", level:"orange", image:"m3_2.png", video:"https://www.youtube.com/watch?v=cngmwRRKKdk", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"רמה מקסימלית" }
          ]
        },
        {
          id: "d5m4", name: "Stability", nameHe: "יציבות", image: "m4.png",
          exercises: [
            { id:"d5m4e1", name:"Bird Dog", level:"green", image:"m4_1.png", video:"https://www.youtube.com/watch?v=o6SKKf5ccAs", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"60 שניות החזקה יציבה" }
          ]
        },
        {
          id: "d5m5", name: "Scapular Push-Up", nameHe: "שכמה", image: "m5.png",
          exercises: [
            { id:"d5m5e1", name:"Scapular Push-Up", level:"green", image:"m5_1.png", video:"https://www.youtube.com/watch?v=huGj4aBk9C4", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0", type:"isolation", progression:"3×15 בטכניקה מושלמת + RIR≥1" }
          ]
        },
        {
          id: "d5m6", name: "Cat-Cow Reset", nameHe: "איפוס", image: "m6.png",
          exercises: [
            { id:"d5m6e1", name:"Cat-Cow Reset", level:"green", image:"m6_1.png", video:"https://www.youtube.com/shorts/2of247Kt0tU", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-", type:"isometric", progression:"ביצוע חלק ומבוקר" }
          ]
        }
      ]
    }
  ],

  levelColors: {
    green:  { emoji:"🟢", hex:"#22c55e", name:"ירוק – בסיסי", nameEn:"Beginner" },
    blue:   { emoji:"🔵", hex:"#3b82f6", name:"כחול – ביניים", nameEn:"Intermediate" },
    orange: { emoji:"🟠", hex:"#f97316", name:"כתום – מתקדם", nameEn:"Advanced" },
    red:    { emoji:"🔴", hex:"#ef4444", name:"אדום – מקצועי", nameEn:"Expert" }
  },

  exerciseTypes: {
    compound:  { name:"תרגיל מורכב", sets:"3-4", reps:"6-10", rest:"2-3 דקות", tempo:"3-1-X-1" },
    isolation: { name:"תרגיל בידוד", sets:"2-3", reps:"10-15", rest:"60-90 שניות", tempo:"2-0-2-0" },
    isometric: { name:"תרגיל איזומטרי", sets:"3", reps:"30-60 שניות", rest:"60 שניות", tempo:"-" },
    cardio:    { name:"קרדיו", sets:"-", reps:"40-45 דקות", rest:"-", tempo:"-" }
  }
};
