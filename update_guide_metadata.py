import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# The updated strings based on our new program logic:
updates = {
    'Scapular Pull-up': 'שבועות 1-8: 2-3×8-12',
    'Band-assisted Pull-up': 'שבועות 9-16: 3×5-10',
    'Chin-up': 'שבועות 17-33: 3-5×5-8 (דילואד בשבועות 25, 33)',
    'Pull-up': 'שבועות 34-52: 3-5×5-8 (דילואד בשבועות 41, 49)',
    
    'Banded RDL': 'שבועות 1-16: 3-4×10-15',
    'Banded Hip Thrust': 'שבועות 17-33: 3-5×8-12',
    'Single-leg Hip Thrust': 'שבועות 34-52: 4-5×8-10 לכל רגל',
    
    'Band Row': 'שבועות 1-12: 3-4×8-12 | משמש כדילואד בשבועות 33, 41, 49',
    'Single-arm Band Row': 'שבועות 13-32: 4×8-10 | שבועות 34-40: 4×10-12 | שבועות 42-52: 5×8-12',
    
    'Incline Push-up': 'שבועות 1-12: 2-3×6-12',
    'Push-up רגיל': 'שבועות 13-16: 3×8-12 | שבוע 25: 2×5',
    'Diamond Push-up': 'שבועות 17-33: 3-5×8-12',
    'Banded Push-up': 'שבועות 34-52: 4-5×6-12',
    
    'Squat איטי': 'שבועות 1-12: 3×8-12',
    'Split Squat': 'שבועות 13-16: 3×8-10',
    'Bulgarian Split Squat': 'שבועות 17-33: 3-5×6-8 לכל רגל',
    'Banded Bulgarian Split Squat': 'שבועות 34-52: 4-5×5-8 לכל רגל',
    
    'Banded OHP': 'שבועות 1-33: 3-5×6-10',
    'Pike Push-up': 'שבועות 34-52: 4-5×8-10'
}

for ex in data['exercises']:
    name = ex['תרגיל']
    if name in updates:
        ex['סטים×חזרות לפי שלב'] = updates[name]

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated guide metadata successfully.")
