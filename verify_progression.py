import json

with open("training_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)["daily"]

exercises_to_track = [
    "goblet-bulgarian-split-squat",
    "goblet-reverse-lunge",
    "pistol-squat",
    "single-arm-floor-press",
    "single-arm-seated-ohp",
    "one-arm-db-row"
]

print("=== Weight Progression Audit ===")
for ex_id in exercises_to_track:
    print(f"\n--- {ex_id} ---")
    current_weight = None
    for day in data:
        week = day.get("week")
        for ex in day.get("exercises", []):
            if ex.get("id") == ex_id:
                w = ex.get("weight")
                if w != current_weight:
                    print(f"{week} (Day {day['dayNum']}): {w}")
                    current_weight = w
