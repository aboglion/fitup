import json
try:
    with open('training_data.json', 'r') as f:
        data = json.load(f)
    day5 = data['daily'][4]
    print(f"Day Type: {day5['Day Type']}")
    for i in range(1, 8):
        k = f"W{i} - Exercise"
        print(f"{k}: {day5.get(k)}")
except Exception as e:
    print(f"ERROR: {e}")
