import json

with open("js/data.js") as f:
    d = f.read().replace("window.TRAINING_DATA = ", "").replace(";", "")

j = json.loads(d)
for week_num in [1, 20, 50, 78]:
    print(f"\nChecking Week {week_num}...")
    for day in j["daily"]:
        if day.get("week") == f"Week {week_num}":
            for ex in day.get("exercises", []):
                if ex.get("id") in ["goblet-bulgarian-split-squat", "single-arm-floor-press"]:
                    print(f"Day {day['dayNum']} - {ex['name']} : {ex.get('weight')}")
