import sys
sys.path.append('.')
from generate_program import BLOCKS, get_warmup, generate_program

def get_block_start_week(k):
    return int(k.split('-')[0])

exercises_by_workout = {'A': {}, 'B': {}, 'C': {}}
weights_by_exercise = {}

for k, v in BLOCKS.items():
    week = get_block_start_week(k)
    for w_type, ex_list in v.items():
        for name, sets, weight in ex_list:
            if name not in exercises_by_workout[w_type]:
                exercises_by_workout[w_type][name] = week
            else:
                exercises_by_workout[w_type][name] = min(week, exercises_by_workout[w_type][name])
            
            if weight and 'kg' in weight:
                if name not in weights_by_exercise:
                    weights_by_exercise[name] = []
                if not weights_by_exercise[name] or weights_by_exercise[name][-1]['weight'] != weight:
                    weights_by_exercise[name].append({'weight': weight, 'fromWeek': week})

for w in get_warmup():
    for w_type in ['A', 'B', 'C']:
        exercises_by_workout[w_type][w['name']] = 1

import json
print("EX_BY_WORKOUT =", json.dumps(exercises_by_workout, indent=2))
print("WEIGHTS =", json.dumps(weights_by_exercise, indent=2))

guide = generate_program()["exercises"]
categories = {}
for e in guide:
    categories[e['name']] = e['category']

# build paths for A, B, C
for w_type in ['A', 'B', 'C']:
    paths = {}
    for name, week in exercises_by_workout[w_type].items():
        cat = categories.get(name, 'Warmup')
        if cat not in paths:
            paths[cat] = []
        paths[cat].append({"name": name, "unlockWeek": week})
    
    print(f"\nPATHS for {w_type}:")
    for cat, exes in paths.items():
        exes.sort(key=lambda x: x['unlockWeek'])
        print(f"  {cat}:")
        for e in exes:
            print(f"    - {e['name']} (Week {e['unlockWeek']})")
