import json

with open("training_data.json", encoding="utf-8") as f:
    data = json.load(f)

# Update Banded RDL link to https://www.youtube.com/watch?v=xZoWmGj_tEs
target_link = "https://www.youtube.com/watch?v=xZoWmGj_tEs"

# 1. Update in exercises
for item in data.get("exercises", []):
    if item.get("תרגיל") == "Banded RDL":
        item["קישור יוטיוב"] = target_link
        if "קישור יוטיוב_link" in item:
            item["קישור יוטיוב_link"] = target_link

# 2. Update in daily
for item in data.get("daily", []):
    for k in ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "תוספות"]:
        if item.get(f"{k} - תרגיל") == "Banded RDL":
            item[f"{k} - קישור"] = target_link

with open("training_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated training_data.json successfully.")

# Now for js/data.js
# We need to construct the JSON similarly to how it was before
# Let's see if we can just read js/data.js, extract the JSON, update it, and write it back.
import re

with open("js/data.js", encoding="utf-8") as f:
    content = f.read()

match = re.search(r"const trainingData = (\{.*?\});", content, re.DOTALL)
if match:
    js_data = json.loads(match.group(1))
    
    for item in js_data.get("exercises", []):
        if item.get("name") == "Banded RDL":
            item["videoUrl"] = target_link
            
    for daily_item in js_data.get("daily", []):
        for ex in daily_item.get("exercises", []):
            if ex.get("name") == "Banded RDL":
                ex["videoUrl"] = target_link
                
    new_json_str = json.dumps(js_data, ensure_ascii=False)
    # the original file is minified json on one line mostly, wait, indent it if needed, no just replace
    new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    with open("js/data.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated js/data.js successfully.")
else:
    print("Could not find JSON in js/data.js")
