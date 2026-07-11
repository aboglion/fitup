import os
from generate_program import BLOCKS, get_warmup, generate_program

# 1. Get all exercises actually used in the program
program_exercises = set()
for k, v in BLOCKS.items():
    for w_type, ex_list in v.items():
        for name, sets, weight in ex_list:
            program_exercises.add(name)

for warmup in get_warmup():
    program_exercises.add(warmup['name'])

# 2. Get all exercises from the guide
guide = generate_program()["exercises"]
guide_exercises = set(e['name'] for e in guide)

# 3. Get all images from images/exercises/
image_dir = "images/exercises"
image_files = set()
if os.path.exists(image_dir):
    for f in os.listdir(image_dir):
        if f.endswith(".png"):
            # Revert filename mapping to exercise name to compare
            # Wait, image filenames are uppercase with hyphens instead of slashes.
            # But the mapping in generate_program.py does: name.replace('/', '-').upper() + ".png"
            image_files.add(f)

# Compute sets for checks
# Expected images based on program_exercises
expected_program_images = {name.replace('/', '-').upper() + ".png" for name in program_exercises}

# Expected images based on guide_exercises
expected_guide_images = {name.replace('/', '-').upper() + ".png" for name in guide_exercises}

print("--- AUDIT REPORT ---")

print("\n1. Exercises in PROGRAM but missing IMAGES:")
missing_images = expected_program_images - image_files
if missing_images:
    for img in sorted(missing_images):
        print("   -", img)
else:
    print("   None. All program exercises have images.")

print("\n2. Images that have NO EXERCISES in the PROGRAM:")
orphan_images = image_files - expected_program_images
if orphan_images:
    for img in sorted(orphan_images):
        print("   -", img)
else:
    print("   None. All images are used in the program.")

print("\n3. Exercises in EXERCISE GUIDE but NOT in the PROGRAM:")
guide_not_in_program = guide_exercises - program_exercises
if guide_not_in_program:
    for ex in sorted(guide_not_in_program):
        print("   -", ex)
else:
    print("   None. All exercises in the guide are used in the program.")

print("\n4. Exercises in PROGRAM but NOT in EXERCISE GUIDE:")
program_not_in_guide = program_exercises - guide_exercises
if program_not_in_guide:
    for ex in sorted(program_not_in_guide):
        print("   -", ex)
else:
    print("   None. All exercises in the program are documented in the guide.")
