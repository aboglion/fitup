import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for ex in data['exercises']:
    if ex['תרגיל'] in ['Diamond Push-up', 'Bulgarian Split Squat', 'Inverted Row']:
        print(ex)
