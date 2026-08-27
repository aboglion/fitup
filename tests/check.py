import os
import re

exercises_file = os.path.join(os.path.dirname(__file__), '../js/exercises.js')

with open(exercises_file, 'r') as f:
    content = f.read()

# Extract EXERCISE_WEIGHT_PROGRESSION
progression_match = re.search(r'const EXERCISE_WEIGHT_PROGRESSION = \{(.*?)\};', content, re.DOTALL)
prog_tiers = {}
if progression_match:
    lines = progression_match.group(1).split('\n')
    for line in lines:
        match = re.search(r"'([^']+)':.*?fromWeek: (\d+)", line)
        if match:
            prog_tiers[match.group(1)] = int(match.group(2))

# Extract SKILL_TREES
tree_match = re.search(r'const SKILL_TREES = \{(.*?)\};\n', content, re.DOTALL)
tree_unlocks = {}
if tree_match:
    lines = tree_match.group(1).split('\n')
    for line in lines:
        match = re.search(r"name: '([^']+)', unlockWeek: (\d+)", line)
        if match:
            tree_unlocks[match.group(1)] = int(match.group(2))

print("Mismatches between EXERCISE_WEIGHT_PROGRESSION fromWeek[0] and SKILL_TREES unlockWeek:")
for name, unlock_week in tree_unlocks.items():
    prog_week = prog_tiers.get(name)
    if prog_week is not None and prog_week != unlock_week:
        print(f"{name}: Tree says {unlock_week}, Progression says {prog_week}")

print("\nMissing in EXERCISE_WEIGHT_PROGRESSION but in SKILL_TREES:")
for name, unlock_week in tree_unlocks.items():
    if name not in prog_tiers:
        print(f"{name}: Tree says {unlock_week}")
