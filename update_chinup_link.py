import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for ex in data['exercises']:
    if ex['תרגיל'] == 'Chin-up':
        ex['קישור יוטיוב'] = 'https://www.youtube.com/watch?v=e1YSApl-QcM'
        ex['קישור יוטיוב_link'] = 'https://www.youtube.com/watch?v=e1YSApl-QcM'

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated video link for Chin-up")
