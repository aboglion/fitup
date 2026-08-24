import json
data = open('js/data.js').read()
start = data.find('{')
end = data.rfind('}') + 1
obj = json.loads(data[start:end])

# Check Day 1 Toggle - Pistol Squat Progression unlock
print("--- Day 1 Pistol Squat Progression ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 92, 99, 106, 113, 120, 127, 134, 141, 148, 155, 162, 169, 176, 183, 190, 197, 204, 211, 218, 225, 232, 239, 246, 253, 260, 267, 274, 281, 288, 295, 302, 309, 316, 323, 330, 337, 344, 351, 358]:
        for ex in day.get('exercises', []):
            if ex.get('id') == 'pistol-squat-progression':
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")} - unlocked: {ex.get("unlocked")}')

# Also check if Pistol Squat Progression appears in any day
print("\n--- All Pistol Squat Progression occurrences ---")
for day in obj.get('daily', []):
    for ex in day.get('exercises', []):
        if ex.get('id') == 'pistol-squat-progression':
            print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")} - unlocked: {ex.get("unlocked")}')

# Check Reverse Lunge in even weeks
print("\n--- Day 1 Reverse Lunge in even weeks ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [8, 22, 36, 50, 64, 78, 92, 106, 120, 134, 148, 162, 176, 190, 204, 218, 232, 246, 260, 274, 288, 302, 316, 330, 344, 358]:
        for ex in day.get('exercises', []):
            if ex.get('id') == 'reverse-lunge':
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")}')

# Check Single-Leg RDL in odd weeks
print("\n--- Day 1 Single-Leg RDL in odd weeks ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [1, 15, 29, 43, 57, 71, 85, 99, 113, 127, 141, 155, 169, 183, 197, 211, 225, 239, 253, 267, 281, 295, 309, 323, 337, 351]:
        for ex in day.get('exercises', []):
            if ex.get('id') == 'single-leg-rdl':
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")}')