import re

with open('generate_program.py', 'r') as f:
    lines = f.readlines()

new_lines = []
in_phase_3_5 = False
for i, line in enumerate(lines):
    # Detect start of Phase 3 (weeks 17-19 block)
    if '"17-19": {' in line:
        in_phase_3_5 = True
    
    if in_phase_3_5 and '"Bodyweight Single-Leg RDL"' in line:
        line = line.replace('"Bodyweight Single-Leg RDL"', '"Banded Single-Leg RDL"')
    if in_phase_3_5 and '"Single-Leg Glute Bridge"' in line:
        line = line.replace('"Single-Leg Glute Bridge"', '"Banded Glute Bridge"')
        
    new_lines.append(line)

content = "".join(new_lines)

video_insert = """    "Banded Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",
    "Banded Glute Bridge": "https://www.youtube.com/watch?v=JCqhuq4bCio&t=1s","""

content = content.replace('"Bodyweight Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",', '"Bodyweight Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",\n' + video_insert)

guide_insert = """        {"name":"Banded Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Advanced","weight":"Resistance Band","videoUrl":VIDEOS["Banded Single-Leg RDL"],"setsProgression":"Phase 3-5: 3-4×8-10 each leg"},
        {"name":"Banded Glute Bridge","category":"Glutes","difficulty":"Intermediate","weight":"Resistance Band","videoUrl":VIDEOS["Banded Glute Bridge"],"setsProgression":"Phase 3-5: 3-4×10-15 each leg"},"""

content = content.replace('        {"name":"Bodyweight Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Bodyweight Single-Leg RDL"],"setsProgression":"Phase 1-5: 3-4×8-10 each leg"},', '        {"name":"Bodyweight Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Bodyweight Single-Leg RDL"],"setsProgression":"Phase 1-2: 3-4×8-10 each leg"},\n' + guide_insert)

content = content.replace('        {"name":"Single-Leg Glute Bridge","category":"Glutes","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Single-Leg Glute Bridge"],"setsProgression":"Phase 1-5: 3-4×8-12 each leg"},', '        {"name":"Single-Leg Glute Bridge","category":"Glutes","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Single-Leg Glute Bridge"],"setsProgression":"Phase 1-2: 3-4×8-10 each leg"},')

with open('generate_program.py', 'w') as f:
    f.write(content)

print("Modified generate_program.py successfully.")
