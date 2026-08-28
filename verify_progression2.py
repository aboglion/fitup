import json

with open("training_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)["daily"]

exercises_to_track = [
    "Goblet Bulgarian Split Squat",
    "Goblet Reverse Lunge",
    "Pistol Squat",
    "Single-Arm Floor Press",
    "Single-Arm Seated OHP",
    "One-Arm DB Row"
]

print("=== Weight Progression Audit ===")
for ex_name in exercises_to_track:
    print(f"\n--- {ex_name} ---")
    current_weight = None
    for day in data:
        week = day.get("week")
        for ex in day.get("exercises", []):
            if ex.get("name") == ex_name:
                w = ex.get("weight")
                if w != current_weight:
                    print(f"{week} (Day {day['dayNum']}): {w}")
                    current_weight = w
