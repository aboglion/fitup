import json, re

with open('training_data.json') as f:
    data = json.load(f)

program_exercises = set()
for day in data['daily']:
    for ex in day.get('exercises', []):
        program_exercises.add(ex['name'])

with open('js/exercises.js') as f:
    js_content = f.read()

tree_exercises = set()
tree_match = re.search(r'const SKILL_TREES = \{(.*?)\};\n', js_content, re.DOTALL)
if tree_match:
    for line in tree_match.group(1).split('\n'):
        match = re.search(r"name: '([^']+)'", line)
        if match:
            tree_exercises.add(match.group(1))

print("In Program but NOT in Skill Tree:")
for name in sorted(program_exercises - tree_exercises):
    if name not in ['High Knees', 'Deep Mobility Protocol', 'Band Neck Flexion & Extension', 'Micro Mobility Protocol', 'Wrist Rocks', 'Arm Circles', 'Wall Slides', 'Scapular Push-up', 'Band Pull-Apart', 'Scapular Pull-up', 'Dead Hang', 'Relaxed Walking', 'Brisk Walking', 'VO2 Max Norwegian 4x4', 'Glute Bridge']:
        print(f"  - {name}")

print("\nIn Skill Tree but NOT in Program:")
for name in sorted(tree_exercises - program_exercises):
    print(f"  - {name}")

