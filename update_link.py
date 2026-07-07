import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for ex in data['exercises']:
    if ex['תרגיל'] == 'Band-assisted Pull-up':
        ex['קישור יוטיוב'] = 'https://www.youtube.com/watch?v=ZHllQTJf7eA'
        ex['קישור יוטיוב_link'] = 'https://www.youtube.com/watch?v=ZHllQTJf7eA'

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated video link")
