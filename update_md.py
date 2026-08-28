import re

with open("UPDATE_PROGRAM.md", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update basic text rules
content = content.replace("3–24 ק״ג", "3–32 ק״ג")
content = content.replace(
    "[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]",
    "[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]"
)

# 2. Update max weights in tables
content = content.replace("/ 24 ק״ג", "/ 32 ק״ג")
content = content.replace("/ 18 ק״ג", "/ 20 ק״ג") # For biceps

# 3. Update rest times in the summary table
content = content.replace("| Single-Arm Floor Press | 105 | 90–120 |", "| Single-Arm Floor Press | 90 | 75–105 |")
content = content.replace("| Pull-Up/Chin-Up | 105 | 90–120 |", "| Pull-Up/Chin-Up | 90 | 75–105 |")
content = content.replace("| Single-Arm Seated OHP | 82 | 75–90 |", "| Single-Arm Seated OHP | 75 | 60–90 |")
content = content.replace("| One-Arm DB Row | 82 | 75–90 |", "| One-Arm DB Row | 75 | 60–90 |")

# 4. Update rest times in individual exercise sections
# We need to target the specific sections if we can. A regex is safer for this.
def replace_rest(match):
    exercise_name = match.group(1)
    if "single-arm-floor-press" in exercise_name.lower():
        return match.group(0).replace("105 (base), 90–120", "90 (base), 75–105")
    if "single-arm-seated-ohp" in exercise_name.lower():
        return match.group(0).replace("82 (base), 75–90", "75 (base), 60–90")
    if "one-arm-db-row" in exercise_name.lower():
        return match.group(0).replace("82 (base), 75–90", "75 (base), 60–90")
    if "pull-up-progression" in exercise_name.lower() or "pull-up-overhand" in exercise_name.lower():
        return match.group(0).replace("105 (base), 90–120", "90 (base), 75–105")
    return match.group(0)

content = re.sub(r'\|\s*id\s*\|\s*([^|]+)\s*\|.*?(?=\|\s*id\s*\||\Z)', replace_rest, content, flags=re.IGNORECASE | re.DOTALL)

with open("UPDATE_PROGRAM.md", "w", encoding="utf-8") as f:
    f.write(content)
