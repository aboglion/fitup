import re

with open("generate_program.py", "r", encoding="utf-8") as f:
    content = f.read()

# Update rests for day 3 and 5 exercises in generate_program.py

# Day 3
# Single-Arm Floor Press: rest=105 -> rest=90
content = re.sub(r'make_ex_obj\("A2", "single-arm-floor-press", (.*?), rest=105,', r'make_ex_obj("A2", "single-arm-floor-press", \1, rest=90,', content)
# Single-Arm Seated OHP: rest=82 -> rest=75
content = re.sub(r'make_ex_obj\("A4", "single-arm-seated-ohp", (.*?), rest=82,', r'make_ex_obj("A4", "single-arm-seated-ohp", \1, rest=75,', content)
# push-up variations (deficit, weighted) that have rest=90 could go to 75, but they were not specified. Let's keep them or just change the base definitions

# Day 5
# Pull-up: rest=105 -> rest=90
content = re.sub(r'make_ex_obj\("A1", "pull-up-progression", (.*?), rest=105,', r'make_ex_obj("A1", "pull-up-progression", \1, rest=90,', content)
content = re.sub(r'make_ex_obj\("A1", "pull-up-overhand", (.*?), rest=105,', r'make_ex_obj("A1", "pull-up-overhand", \1, rest=90,', content)
# Weighted Pull-up: rest=120 -> rest=105
content = re.sub(r'make_ex_obj\("A1", "weighted-pull-up", (.*?), rest=120,', r'make_ex_obj("A1", "weighted-pull-up", \1, rest=105,', content)

# One-Arm DB Row: rest=82 -> rest=75
content = re.sub(r'make_ex_obj\("A2", "one-arm-db-row", (.*?), rest=82,', r'make_ex_obj("A2", "one-arm-db-row", \1, rest=75,', content)

# Also update EXERCISES_CATALOG base rest values
content = content.replace('"restSeconds": 105,\n        "restRange": [90, 120],', '"restSeconds": 90,\n        "restRange": [75, 105],')
content = content.replace('"restSeconds": 105,', '"restSeconds": 90,')
content = content.replace('"restSeconds": 82,\n        "restRange": [75, 90],', '"restSeconds": 75,\n        "restRange": [60, 90],')
content = content.replace('"restSeconds": 82,', '"restSeconds": 75,')

with open("generate_program.py", "w", encoding="utf-8") as f:
    f.write(content)
