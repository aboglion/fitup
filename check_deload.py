import json
data = open('js/data.js').read()
start = data.find('{')
end = data.rfind('}') + 1
obj = json.loads(data[start:end])

# Check Deload weeks (every 8 weeks: 8, 16, 24, 32, 40, 48, 56)
print("--- Deload Weeks ---")
for day in obj.get('daily', []):
    if day.get('isDeload', False):
        print(f'Day {day.get("dayNum")} ({day.get("week")}): {day.get("dayType")} - isDeload: {day.get("isDeload")}')
        for ex in day.get('exercises', []):
            if not ex.get('isWarmup', False):
                print(f'  {ex.get("slot")}: {ex.get("name")} - sets: {ex.get("sets")} - structure: {ex.get("structure")}')

# Check Band Pull-Apart in warmup vs main
print("\n--- Band Pull-Apart in Day 3 ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [3, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 94, 101, 108, 115, 122, 129, 136, 143, 150, 157, 164, 171, 178, 185, 192, 199, 206, 213, 220, 227, 234, 241, 248, 255, 262, 269, 276, 283, 290, 297, 304, 311, 318, 325, 332, 339, 346, 353, 360]:
        for ex in day.get('exercises', []):
            if ex.get('id') == 'band-pull-apart':
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - slot: {ex.get("slot")} - isWarmup: {ex.get("isWarmup")} - sets: {ex.get("sets")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")}')

# Check Day 1 Toggle - Pistol Squat Progression unlock
print("\n--- Day 1 Pistol Squat Progression ---")
for day in obj.get('daily', []):
    if day.get('dayNum') in [1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 92, 99, 106, 113, 120, 127, 134, 141, 148, 155, 162, 169, 176, 183, 190, 197, 204, 211, 218, 225, 232, 239, 246, 253, 260, 267, 274, 281, 288, 295, 302, 309, 316, 323, 330, 337, 344, 351, 358]:
        for ex in day.get('exercises', []):
            if ex.get('id') == 'pistol-squat-progression':
                print(f'Day {day.get("dayNum")} ({day.get("week")}): {ex.get("name")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")} - unlocked: {ex.get("unlocked")}')