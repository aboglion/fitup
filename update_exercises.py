import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Exercise Master List:")
master_exercises = {ex['name']: ex for ex in data['exercise_master_list']}
for name in master_exercises:
    print(f"- {name}")

