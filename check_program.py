import json
data = open('js/data.js').read()
start = data.find('{')
end = data.rfind('}') + 1
obj = json.loads(data[start:end])

# Check daily structure for all 7 days
for i, day in enumerate(obj.get('daily', [])):
    print(f'Day {day.get("dayNum")}: {day.get("dayType")} - {len(day.get("exercises", []))} exercises')
    for ex in day.get('exercises', []):
        if not ex.get('isWarmup', False):
            print(f'  {ex.get("slot")}: {ex.get("name")} - sets: {ex.get("sets")} - structure: {ex.get("structure")} - pairId: {ex.get("pairId")} - toggleGroup: {ex.get("toggleGroup")} - toggleActiveOn: {ex.get("toggleActiveOn")} - blockId: {ex.get("blockId")} - circuitId: {ex.get("circuitId")}')