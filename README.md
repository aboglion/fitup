# 🏋️‍♂️ FitUp Pro v15.6 Lean Edition

> **A 52-Week Automated Prescriptive Lean Training & AI Nutrition System featuring "Zero Decisions" 3-Button Set Outcome Tracking, Myo-Reps Clusters, Adaptive Intra-Workout Rest Timers, Dynamic Muscle Anatomy Tracking, and Google Fit & Drive Sync.**

---

## 🌟 Overview

**FitUp Pro v15.6 Lean Edition** is an advanced, offline-first Web Application designed for long-term physical progression, hypertrophic gains, cardiovascular conditioning, and precision workout tracking.

Built on a strict **"Zero Decisions" Philosophy**, every single workout day across the 52-week (364-day) period is fully prescribed—down to exact exercise ordering, target rep ranges, weight progressions, tempo control, rest intervals, structural tags, and micro-mobility integration.

Set completion operates under an objective **3-Button Outcome Classifier** (🚀 **ABOVE**, ✅ **IN_WINDOW**, ⚠️ **BELOW** / Mechanical Stop), which feeds the atomic progression engine and adjusts intra-workout rest timers dynamically (+30s extension on mechanical stop).

---

## ✨ Key Features

### 🏋️‍♂️ Prescriptive 52-Week Lean Training Engine
- **Periodized Progression**: Structured across 15 distinct training phases over 52 weeks (Year 1 Foundation & Peak + Year 2 Mastery).
- **Zero Decisions 3-Button Outcome Selector**: Objective set classification (🚀 Above Target, ✅ In Window, ⚠️ Mechanical Stop / Failure) replacing guesswork.
- **Myo-Reps & Arm Block Integration**: High-density cluster reps and double-progression ladder protocols for maximal hypertrophy.
- **Adaptive Intra-Workout Rest Engine**: Dynamically calculates rest timers with automatic +30s extensions following a mechanical stop (`BELOW` outcome).
- **Time Efficiency Protocol (Weeks 34+)**: Caps workouts to a crisp 45–50 minutes through:
  - **Antagonistic Supersets**: Pairing non-competing muscle groups (e.g., Push/Pull, Biceps/Triceps) to reduce workout duration by up to 50%.
  - **Unilateral Staggered Rest**: Eliminating dead time during single-arm/single-leg movements.
  - **Arm Block v5 Integration**: Double-progression ladder protocols for maximal arm hypertrophy without redundant main-table set fatigue.
- **Cardiovascular & Recovery Integration**:
  - **Norwegian 4x4 VO2 Max**: High-intensity interval treadmill running capped at ≤6% incline for joint protection.
  - **Zone 2 Cardio & Micro-Mobility**: Dedicated active recovery days and dead hangs/thoracic extensions integrated into rest periods.

### 🧬 Dynamic 14-Muscle Anatomy Visualizer
- Real-time front and back character map rendering **14 distinct muscle groups** (Chest, Shoulders, Triceps, Biceps, Forearms, Lats, Traps, Quads, Hamstrings, Glutes, Calves, Core, Obliques, Lower Back).
- Weighted multi-exercise contribution model calculating live muscle activation percentages based on logged completions and exercise progression milestones.

### ⌚ Google Fit Health & Activity Synchronization
- Syncs daily step counts, active energy expenditure (burned calories), and heart rate intensity metrics directly from Google Fit APIs (`fitness.activity.read` and `fitness.body.read`).
- Dynamically adjusts daily net caloric balance based on real-time step activity and cardiovascular strain.

### 🤖 Gemini AI Nutrition & Fitness Coach
- Direct integration with Google Gemini AI (`gemini-3.1-flash-lite` & models) for instant meal photo analysis, macro breakdowns (Calories, Protein, Carbs, Fats), sodium/fat warnings, and customized recovery advice.
- Includes manual meal entry fallback and one-tap protein powder supplement tracking (+24g protein per scoop).

### ☁️ Google Drive Cloud Backup & Client-Side Encryption
- Seamless cloud synchronization across devices using private Google Drive storage (`drive.file` scope).
- AES-256 GCM client-side key encryption ensuring user API keys and private workout logs remain strictly secure.

### 🌳 RPG Skill Tree & Level Progression
- Leveling and XP system (500 XP per completed strength day, 200 XP for active recovery walk/cardio days), streak tracking, and interactive exercise skill tree nodes unlocked week-by-week.

### 📷 Progress Photo Tracker & 364-Day Consistency Map
- In-app progress photo logging with automated client-side WebP image compression.
- 364-day visual consistency matrix tracking adherence across 5 day classifications (Strength, Deload, Walk, Rest, Skipped).

### 🌐 Multi-Language & RTL Support (I18n)
- Full internationalization supporting **English**, **Hebrew** (RTL), and **Arabic** (RTL).
- Exportable, self-contained workout guide generator for printing or PDF exports in any supported language.

### 📱 Offline-First Architecture
- Built with **IndexedDB** for zero-latency local data persistence (workout completions, actual RPE, body weight, notes, and photos).

---

## 📸 Application Interface & Feature Walkthrough

FitUp Pro Ultimate v15.6 Lean combines advanced athletic periodization with a high-tech Sci-Fi aesthetic. Below is a detailed visual walkthrough of the primary modules and features:

### 1. Progress & Stats Dashboard & Interactive Muscle Map
<img src="PICS/Pasted%20image.png" alt="Progress Dashboard, Google Fit Sync & Interactive Muscle Map" width="380" />

- **Google Fit Real-Time Sync**: Displays live data retrieved from Google Fit APIs (`fitness.activity.read` and `fitness.body.read`), including daily step counts (e.g., 2,343 steps), active activity calorie burn (e.g., 1,439 kcal), and heart rate monitoring (~120–145 BPM exertion zone). Step calorie expenditure automatically recalibrates daily net energy balances.
- **Level & Gamification Engine**: Visual XP progression bar (Level 1, 0/500 XP). Users earn 500 XP per completed strength workout and 200 XP for active recovery walk days, with instant social sharing capabilities.
- **14-Muscle Interactive Anatomy Map**: Real-time visual character model rendering activation across 14 target muscle groups (Chest, Shoulders, Biceps, Forearms, Core, Obliques, Quads, Hamstrings, Glutes, Lats, Traps, Triceps, Calves, and Lower Back). Live percentage indicators reflect cumulative volume, progressive overload milestones, and targeted stimulus distribution.

---

### 2. Gemini AI Nutrition Log & Daily Caloric Balance
<img src="PICS/Pasted%20image%20%282%29.png" alt="Gemini AI Meal Entry & Daily Calorie Tracker" width="380" />

- **AI-Powered Photo Meal Analysis**: Snap a photo using the device camera ("Capture Food") or upload an image for instant nutritional analysis via Google Gemini AI (`gemini-3.1-flash-lite`). The AI extracts macro estimates (Calories, Protein, Carbs, Fats) and generates deep nutritional insights regarding energy density, sodium content, and post-workout muscle recovery suitability.
- **Daily Calorie & Protein Counters**: Real-time progress bars comparing consumed calories against daily target limits (e.g., 1,150 / 1,980 kcal) and protein goals (e.g., 48 / 160g). Includes quick-add shortcuts for protein supplements (e.g., +24g protein powder per serving).
- **Comprehensive Meal Log Feed**: Timeline of all logged meals with timestamps, macro tags, AI analysis boxes, and manual entry options for meals without photos.

---

### 3. RPG Skill Tree & Exercise Directory
<img src="PICS/Pasted%20image%20%283%29.png" alt="RPG Skill Tree & Exercise Directory" width="380" />

- **Categorized Movement Domains**: Filterable exercise directory divided into four primary disciplines: **Legs + Core**, **Push + Skill**, **Pull + Grip**, and **Cardio & Recovery**.
- **Interactive Progression Skill Tree**: Visual node tree displaying week-by-week exercise unlocks across the 52-week roadmap. Features dedicated warmups (High Knees, Deep Mobility Protocol) and locked future skill nodes (e.g., Week 53 Wrist Rocks, Pistol Squats to chair).

---

### 4. Anatomical Muscle Breakdown & Animated Execution
<img src="PICS/Pasted%20image%20%284%29.png" alt="Exercise Detail Modal with Muscle Highlights and GIF Demo" width="380" />

- **Target Muscle Visualizer**: Every exercise card (e.g., Dumbbell Romanian Deadlift - DB RDL) opens a high-detail modal highlighting primary target muscle groups (glutes and hamstrings highlighted in vivid red on an anatomical body model).
- **Looping Demonstration GIFs**: Embedded high-definition animation loops demonstrating proper biomechanical form, setup posture, movement cadence, and safety control.

---

### 5. Searchable Exercise Library & Muscle Filtering
<img src="PICS/Pasted%20image%20%285%29.png" alt="Searchable Exercise Library with Category Filters" width="380" />

- **Instant Search & Multi-Category Filters**: Instant search engine with tag filters (All, Arms, Shoulders, Warmup, Pull, Push, Legs, Core) to find any movement in the 52-week dictionary.
- **Detailed Card Metadata**: Shows required equipment (e.g., Dumbbells, Bodyweight, TRX), difficulty rating (Beginner, Intermediate, Advanced), schedule assignment badges, and primary target muscle diagrams (e.g., DB Biceps Curl, DB Lateral Raise, DB Overhead Triceps Extension).

---

### 6. Today View Workout Tracker & 3-Button Set Outcome Execution
<img src="PICS/Pasted%20image%20%286%29.png" alt="Today View Interactive Set Logger & Rest Timer" width="380" />

- **Prescriptive Workout Execution**: Displays the exact daily schedule generated by the 52-week training engine. Outlines exact exercise sequence, prescribed set counts, target reps, structural Lean tags, and tempo instructions (e.g., Bodyweight Squat with slow eccentric control, 2 sets of 8 reps, 30s rest interval).
- **3-Button Outcome Logger**: Objective set completion buttons (🚀 **ABOVE**, ✅ **IN_WINDOW**, ⚠️ **BELOW** / Mechanical Stop) replacing guesswork and automatically triggering adaptive rest timers (+30s extension on mechanical stop).

---

### 7. Progress Photo Tracker, Consistency Map & Performance Metrics
<img src="PICS/Pasted%20image%20%287%29.png" alt="Progress Photo Tracker, 364-Day Consistency Map & Analytics" width="380" />

- **Private Progress Photo Journal**: Client-side progress photo recorder (prompted every 4 weeks) compressed into lightweight WebP format and stored locally in IndexedDB for 100% private physical transformation tracking.
- **364-Day Visual Consistency Map**: Grid-style calendar matrix tracking overall program adherence across all 364 days, color-coded by day type (Strength, Deload, Walk, Rest, Skipped).
- **Summary Analytics Grid**: Live dashboard metrics displaying total Days Completed, Strength Workouts Logged, Walk Days Completed, Average Session RPE (Rate of Perceived Exertion), Monthly Completion Rate %, and Weekly Trend %.

---

### 8. Settings Hub, Encrypted Cloud Sync & Program Exporter
<img src="PICS/Pasted%20image%20%288%29.png" alt="Settings Hub, Gemini AI Setup & Google Cloud Sync" width="380" />

- **Gemini AI API Configuration**: Secure setup interface for Google Gemini API key with AES-256 client-side encryption and model selector dropdown (`gemini-3.1-flash-lite`, `gemini-1.5-flash`, etc.).
- **Google Drive & Local Data Backup/Restore**: One-click local JSON file export/import, alongside automatic background sync to Google Drive (`drive.file` scope) to preserve workout logs across all devices without central server data exposure.
- **Full Program Guide Exporter**: Quick launcher to view, print, or export the complete 52-week master program guide and exercise manual in English, Hebrew, or Arabic.

---

## 📋 Training Program Deep Dive

The **FitUp Pro Ultimate v15.6 Lean** program is engineered specifically for home-gym training with high-volume, high-efficiency hypertrophy and cardiovascular optimization over 52 weeks.

### 🗓️ Weekly Microcycle Architecture (7 Days)
Each week follows a strictly optimized 7-day routine designed to balance muscular stimulus, joint recovery, and metabolic conditioning:

| Day | Workout Type | Focus / Key Movements | Target Duration |
| :--- | :--- | :--- | :--- |
| **Day 1 (Mon)** | **Legs + Core** | DB Bulgarian Split Squat, Single-Leg RDL, DB Hip Thrust, Calf Raises, Core Anti-Rotation/Flexion | 45–50 min |
| **Day 2 (Tue)** | **Active Recovery** | Brisk Walking (6,000–8,000 steps), Micro-Mobility, Joint Decompression | 30–45 min |
| **Day 3 (Wed)** | **Push + Skill** | Single-Arm Floor Press, Seated DB OHP, Feet-Elevated Push-Ups, Wall Handstand, Arm Block | 45–50 min |
| **Day 4 (Thu)** | **Active Recovery** | Zone 2 Aerobic Base Walking, Light Stretching | 30–45 min |
| **Day 5 (Fri)** | **Pull + Grip** | Weighted/Bodyweight Pull-Ups & Chin-Ups, One-Arm DB Rows, TRX Face Pulls, Biceps & Towel Hang | 45–50 min |
| **Day 6 (Sat)** | **Cardio VO2 Max** | Norwegian 4x4 Interval Protocol (4×4 min @ 85–95% HRmax, ≤6% treadmill incline) | 35–40 min |
| **Day 7 (Sun)** | **Complete Rest** | System Regeneration, Hydration & Passive Recovery | — |

---

### ⏱️ Time-Efficiency Protocol (Weeks 34+)
Starting from Week 34 (Phases 10–15), workout volume peaks while strict duration controls ensure sessions conclude in **45–50 minutes**:
1. **Antagonistic Supersets**: Pairs push/pull and antagonist movements (e.g., Floor Press paired with TRX Face Pulls, Biceps Curls paired with Overhead Triceps Extensions) with shortened rest intervals, reducing dead time by 50%.
2. **Unilateral Staggered Rest**: Eliminates rest pauses when switching limbs on Single-Arm/Single-Leg exercises (e.g., Left leg rests while Right leg works), keeping overall session time minimal.
3. **Streamlined Main-Table Sets**: Sets for duplicate isolation exercises in the main table are capped at **2 sets** once the **Arm Block v5** (2×10–15 ladder double progression) is active.
4. **Embedded Micro-Mobility**: Dead hangs and thoracic door-frame stretches are performed *during* rest intervals rather than adding standalone extra time.

---

### 📈 52-Week Macrocycle Periodization (15 Phases)
The program is split into two primary macrocycles designed to ensure progressive overload and prevent adaptation plateaus:

- **Year 1 (Weeks 1–52: Foundation, Hypertrophy & Peak)**
  - *Phase 1–3 (Weeks 1–16)*: Anatomical Adaptation, Unilateral Balance & Push-Up/Pull-Up Progression. Introduction of Arm Block v5 at Week 10.
  - *Phase 4–6 (Weeks 18–32)*: Heavy Single-Arm Floor Pressing, Pistol Squat Progressions, Elevated TRX Work.
  - *Phase 7–9 (Weeks 34–52)*: Peak Strength & Volume Density. Time Efficiency Protocol active. Single-Arm OHP & Vest Push-Ups.
- **Year 2 (Weeks 53–52: Advanced Mastery & Weighted Calisthenics)**
  - *Phase 10–13 (Weeks 53–68)*: Weighted Calisthenics (+5 kg Vest Pull-Ups/Push-Ups), Single-Arm Dumbbell Row at 24 kg max capacity, Pistol Squats to chair.
  - *Phase 14–15 (Weeks 70–78)*: Peak Strength Testing & Tapered Transition.
- **Scheduled Deload Microcycles (Every 8 Weeks)**:
  - Occur on Weeks 8, 16, 24, 32, 40, 48, 56, 61, 65, 69, and 73.
  - Volume is reduced by 40–50% with RPE target lowered to 6–7 for full central nervous system (CNS) and joint recovery.

---

### 🛡️ Injury Prevention & Biomechanical Safety Rules
- **Spine & Lumbar Protection**: Hinge movements (RDLs & Hip Thrusts) enforce rigid neutral spine alignment with 2–3 second eccentric control; heavy axial loading is replaced with high-stimulus unilateral Dumbbell Loading.
- **Wrist & Joint Integrity**: Floor pressing and push-up variations strictly utilize Push-Up Bars or dumbbells to prevent wrist hyperextension.
- **Achilles Tendon Guard**: Treadmill running in Norwegian 4x4 intervals is capped at a maximum of **6% incline** to prevent excessive Achilles strain.

---

### 🏋️‍♂️ Required Equipment & Home Setup
The 52-week program is designed around a minimal yet complete home-gym setup:

| Equipment Item | Specifications & Usage | Purpose in Program |
| :--- | :--- | :--- |
| **Modular Dumbbells** | 8 plates × 3 kg (24 kg total plates) + 2 handles. Allows dual dumbbells (3, 6, 9, 12 kg each) and single dumbbell loading (3–24 kg in 3 kg increments). | Floor Press, Seated OHP, RDLs, Split Squats, Single-Arm Rows, Biceps Curls, Triceps Extensions. |
| **Mounted Pull-Up Bar** | Secure doorway or wall-mounted pull-up bar. | Overhand Pull-Ups, Chin-Ups, Dead Hangs, Towel Hangs for grip. |
| **Push-Up Bars** | Ergonomic push-up handles / parallettes. | **Mandatory** for all Push-Ups, Deficit Push-Ups, Elevated Pike Push-Ups, and L-Sit Tucks to prevent wrist hyperextension. |
| **TRX Suspension Trainer** | Adjustable suspension trainer anchored to door/wall. | TRX Face Pulls (Angles 1–4) and TRX Y-T-W shoulder stability sequences. |
| **Resistance Bands** | Loop/flat resistance bands: 30 kg band & 40 kg band. | Band Pull-Aparts, Pallof Press (core anti-rotation), and light warmups. |
| **Sturdy Chair / Box** | Flat, stable chair or workout bench (knee-to-hip height). | Bulgarian Split Squats (BSS), Feet-Elevated Push-Ups, Pistol Squats to chair, Seated OHP. |
| **Treadmill** | Home or gym treadmill with adjustable speed & incline. | Zone 2 Aerobic Base walking, Norwegian 4x4 VO2 Max intervals (incline strictly capped at ≤6%). |
| **Weighted Vest / Pack** | +5 kg weighted vest or loaded backpack. | Advanced Year 2 calisthenics progression (Weighted Pull-Ups & Deficit Push-Ups). |

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | Modern Vanilla HTML5 & CSS3 (Glassmorphism, Dark Theme, Custom Variables) |
| **Logic & Logic Modules** | Modular Vanilla JavaScript (ES6 Pattern, Component Controllers) |
| **Data Engine** | Python 3 (`generate_program.py` script generating `js/data.js` and `training_data.json`) |
| **Database & Storage** | Client-Side IndexedDB API (`js/db.js`) |
| **AI Layer** | Google Gemini API (`js/gemini.js`) |
| **Integrations** | Google Fit APIs & Google Drive Sync API (`drive.file`) |
| **Automation & CLI** | `Makefile` (`make gp` workflow for data compilation and deployment) |

---

## 📁 Repository Structure

```text
fitup/
├── index.html              # Main Single-Page Application (SPA) entry point
├── generate_program.py     # Central Python engine generating 52-week program dataset
├── PROGRAM_GUIDE.md        # Source of truth program manual & methodology guide
├── Makefile                # Automation commands (make gp)
├── PICS/                   # Interface screenshots and feature showcase images
├── css/                    # Modular stylesheet system
│   ├── main.css            # Core CSS variables, typography, and base resets
│   ├── components.css      # Stat cards, skill trees, modals, buttons
│   └── responsive.css      # Mobile, tablet, and desktop breakpoints
├── js/                     # Application logic modules
│   ├── app.js              # Application lifecycle & router
│   ├── data.js             # Serialized 52-week training dataset (generated)
│   ├── db.js               # IndexedDB data access layer
│   ├── anatomy.js          # SVG & CSS 14-muscle visualizer module
│   ├── stats.js            # Progression metrics, XP, and muscle calculation
│   ├── google-fit.js       # Google Fit OAuth & step/calorie/heart-rate sync
│   ├── export-guide.js     # Multilingual PDF/HTML guide exporter
│   ├── gemini.js           # Gemini AI coach integration
│   ├── i18n.js             # Language translations dictionary
│   └── UI.js               # UI renderers, toast notifications, modals
├── images/                 # App assets, exercise thumbnails, and anatomy backgrounds
└── training_data.json      # Structured JSON dump of the 52-week program
```

---

## 🚀 Quick Start & Usage

### 1. Running Locally
Because FitUp Pro Ultimate is built on vanilla web standards, you can serve it with any HTTP static file server:

```bash
# Using Python builtin HTTP server
python3 -m http.server 8080

# Or using Node.js npx serve
npx serve .
```

Open your browser and navigate to `http://localhost:8080`.

### 2. Regenerating Program Data
If you modify the training schedule or volume logic in `generate_program.py`, compile the dataset and sync Git:

```bash
make gp
```

*This command executes `python3 generate_program.py`, updates `js/data.js` and `training_data.json`, commits the changes, and pushes to the `main` branch.*

---

## 📖 Methodology & Training Guidelines

For complete details regarding the 52-week periodization scheme, exercise substitutions, RPE target guidelines, and the Time Efficiency Protocol, refer to [PROGRAM_GUIDE.md](PROGRAM_GUIDE.md).

---

## 📄 License

Internal FitUp Project — All rights reserved.
