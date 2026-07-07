import json
import re

with open("js/data.js", encoding="utf-8") as f:
    content = f.read()

target_link = "https://www.youtube.com/watch?v=xZoWmGj_tEs"
match = re.search(r"window\.TRAINING_DATA = (\{.*?\});?", content, re.DOTALL)
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
    new_content = content[:match.start(1)] + new_json_str + ";" + content[match.end(1):]
    # In case there was a semicolon at the end already, match.end(1) handles it based on how we match
    # Let's be careful about semicolon
    if content[match.end(1):].startswith(";"):
         new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    else:
         new_content = content[:match.start(1)] + new_json_str + ";" + content[match.end(1):]
         
    with open("js/data.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Updated js/data.js successfully.")
else:
    print("Could not find window.TRAINING_DATA in js/data.js")
