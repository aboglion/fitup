import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

links_map = {
    "Band External Rotation": "https://www.youtube.com/watch?v=dLSytuFOCX8",
    "Band Curl": "https://www.youtube.com/watch?v=0hZboUNuogA",
    "Triceps Extension": "https://www.youtube.com/watch?v=8-q04odgg4M",
    "Offset Push-up": "https://www.youtube.com/watch?v=sHpfTeWjIDs",
    "Decline Push-up": "https://www.youtube.com/watch?v=QBlYp-EwHlo"
}

# Update exercises array
for ex in data.get("exercises", []):
    name = ex.get("תרגיל")
    if name in links_map:
        ex["קישור יוטיוב"] = links_map[name]

# Update daily array
slots = ["W1", "A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D1", "D2", "E1", "E2", "E3", "F1", "F2", "תוספות", "תוספות 2", "תוספות 3", "תוספות 4", "תוספות 5"]

for day in data.get("daily", []):
    for slot in slots:
        ex_name = day.get(f"{slot} - תרגיל")
        if ex_name in links_map:
            day[f"{slot} - קישור"] = links_map[ex_name]

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

