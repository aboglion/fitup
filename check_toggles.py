import json
data = open('js/data.js').read()
start = data.find('{')
end = data.rfind('}') + 1
obj = json.loads(data[start:end])

# Check specific days for toggle behavior
# Day 1 - check odd/even weeks
for day in obj.get('daily', []):
    if day.get('dayNum') in [1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 92, 99, 106, 113, 120, 127, 134, 141, 148, 155, 162, 169, 176, 183, 190, 197, 204, 211, 218, 225, 232, 239, 246, 253, 260, 267, 274, 281, 288, 295, 302, 309, 316, 323, 330, 337, 344, 351, 358]:
        # Check for Single-Leg RDL or Reverse Lunge or Pistol
        for ex in day.get('exercises', []):
            if ex.get('id') in ['single-leg-rdl', 'reverse-lunge', 'pistol-squat-progression']:
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")}')

print("\n--- Day 3 Rear Delt Toggle ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [3, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94, 101, 108, 115, 122, 129, 136, 143, 150, 157, 164, 171, 178, 185, 192, 199, 206, 213, 220, 227, 234, 241, 248, 255, 262, 269, 276, 283, 290, 297, 304, 311, 318, 325, 332, 339, 346, 353, 360]:
        for ex in day.get('exercises', []):
            if ex.get('id') in ['trx-ytw', 'band-pull-apart']:
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")}')

print("\n--- Day 5 Biceps Microcycle ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [5, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138, 145, 152, 159, 166, 173, 180, 187, 194, 201, 208, 215, 222, 229, 236, 243, 250, 257, 264, 271, 278, 285, 292, 299, 306, 313, 320, 327, 334, 341, 348, 355, 362]:
        for ex in day.get('exercises', []):
            if ex.get('id') in ['db-curl', 'hammer-curl']:
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - microcycle: {ex.get("microcycle")} - activeWeeks: {ex.get("activeWeeks")}')

print("\n--- Arm Block (from week 10+) ---")
for day in obj.get('daily', []):
    if day.get('dayNum') >= 58:  # week 10 starts around day 58
        for ex in day.get('exercises', []):
            if 'arm-block' in ex.get('id', '') or 'Arm Block' in ex.get('name', ''):
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - structure: {ex.get("structure")}')