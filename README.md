# 🏋️‍♂️ FitUp Pro Ultimate v4.0

> **A 78-Week Automated Training & Nutrition System with "Zero Decisions" Prescriptive Programming, AI Guidance, Dynamic Muscle Anatomy Tracking, and Multi-Language Support.**

---

## 🌟 Overview

**FitUp Pro Ultimate v4.0** is an advanced, offline-first Web Application designed for long-term physical progression, hypertrophic gains, cardiovascular conditioning, and precision workout tracking.

Built on a strict **"Zero Decisions" Philosophy**, every single workout day across the 78-week (546-day) period is fully prescribed—down to exact exercise ordering, target rep ranges, weight progressions, tempo control, rest intervals, and micro-mobility integration.

---

## ✨ Key Features

### 🏋️‍♂️ Prescriptive 78-Week Training Engine
- **Periodized Progression**: Structured across 15 distinct training phases over 78 weeks (Year 1 Foundation & Peak + Year 2 Mastery).
- **Time Efficiency Protocol (Weeks 34+)**: Caps workouts to a crisp 45–50 minutes through:
  - **Antagonistic Supersets**: Pairing non-competing muscle groups (e.g., Push/Pull, Biceps/Triceps) to reduce workout duration by up to 50%.
  - **Unilateral Staggered Rest**: Eliminating dead time during single-arm/single-leg movements.
  - **Arm Block v5 Integration**: Double-progression ladder protocols for maximal arm hypertrophy without redundant main-table set fatigue.
- **Cardiovascular & Recovery Integration**:
  - **Norwegian 4x4 VO2 Max**: High-intensity interval treadmill running capped at ≤6% incline for joint protection.
  - **Zone 2 Cardio & Micro-Mobility**: Dedicated active recovery days and dead hangs/thoracic extensions integrated into rest periods.

### 🧬 Dynamic 14-Muscle Anatomy Visualizer
- Real-time front and back 2D character map rendering **14 distinct muscle groups** (Chest, Shoulders, Triceps, Biceps, Forearms, Lats, Traps, Quads, Hamstrings, Glutes, Calves, Core, Obliques, Lower Back).
- Weighted multi-exercise contribution model calculating live muscle activation percentages based on logged completions and exercise progression milestones.

### 🤖 Gemini AI Nutrition & Fitness Coach
- Direct integration with Google Gemini AI for smart meal image analysis, macro estimations, RPE adjustments, and custom workout advice.

### 🌳 Skill Tree & Gamification
- RPG-style progression system with levels, XP calculation (500 XP per strength day, 200 XP for active recovery), streak tracking, and unlockable exercise skill nodes.

### 📷 Progress Photo Tracker & Time-Lapse
- In-app progress photo uploads with automatic client-side WebP image compression.
- Interactive modal time-lapse animation to view physical transformations over time.

### 🌐 Multi-Language & RTL Support (I18n)
- Full internationalization supporting **English**, **Hebrew** (RTL), and **Arabic** (RTL).
- Exportable, self-contained workout guide generator for printing or PDF exports in any supported language.

### 📱 Offline-First Architecture
- Built with **IndexedDB** for zero-latency local data persistence (workout completions, actual RPE, body weight, notes, and photos).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | Modern Vanilla HTML5 & CSS3 (Glassmorphism, Dark Theme, Custom Variables) |
| **Logic & Logic Modules** | Modular Vanilla JavaScript (ES6 Pattern, Component Controllers) |
| **Data Engine** | Python 3 (`generate_program.py` script generating `js/data.js` and `training_data.json`) |
| **Database & Storage** | Client-Side IndexedDB API (`js/db.js`) |
| **AI Layer** | Google Gemini API (`js/gemini.js`) |
| **Automation & CLI** | `Makefile` (`make gp` workflow for data compilation and deployment) |

---

## 📁 Repository Structure

```text
fitup/
├── index.html              # Main Single-Page Application (SPA) entry point
├── generate_program.py     # Central Python engine generating 78-week program dataset
├── PROGRAM_GUIDE.md        # Source of truth program manual & methodology guide
├── Makefile                # Automation commands (make gp)
├── css/                    # Modular stylesheet system
│   ├── main.css            # Core CSS variables, typography, and base resets
│   ├── components.css      # Stat cards, skill trees, modals, buttons
│   └── responsive.css      # Mobile, tablet, and desktop breakpoints
├── js/                     # Application logic modules
│   ├── app.js              # Application lifecycle & router
│   ├── data.js             # Serialized 78-week training dataset (generated)
│   ├── db.js               # IndexedDB data access layer
│   ├── anatomy.js          # SVG & CSS 14-muscle visualizer module
│   ├── stats.js            # Progression metrics, XP, and muscle calculation
│   ├── export-guide.js     # Multilingual PDF/HTML guide exporter
│   ├── gemini.js           # Gemini AI coach integration
│   ├── i18n.js             # Language translations dictionary
│   └── UI.js               # UI renderers, toast notifications, modals
├── images/                 # App assets, exercise thumbnails, and anatomy backgrounds
└── training_data.json      # Structured JSON dump of the 78-week program
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

For complete details regarding the 78-week periodization scheme, exercise substitutions, RPE target guidelines, and the Time Efficiency Protocol, refer to [PROGRAM_GUIDE.md](PROGRAM_GUIDE.md).

---

## 📄 License

Internal FitUp Project — All rights reserved.
