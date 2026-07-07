import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

difficulties = {
    "Band External Rotation": "מתחילים",
    "Band Curl": "מתחילים",
    "Triceps Extension": "מתחילים",
    "Offset Push-up": "מתקדם",
    "Decline Push-up": "בינוני-מתקדם",
    "Face Pull": "מתחילים"
}

for ex in data.get("exercises", []):
    name = ex.get("תרגיל")
    if name in difficulties and not ex.get("רמת קושי"):
        ex["רמת קושי"] = difficulties[name]

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
