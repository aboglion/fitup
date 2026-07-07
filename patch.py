import json
import re

# 1. Update training_data.json
with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for ex in data['exercises']:
    if ex['תרגיל'] == 'Copenhagen Plank':
        ex['קישור יוטיוב'] = 'https://www.youtube.com/watch?v=5Hs7AfiMXgs'
        ex['קישור יוטיוב_link'] = 'https://www.youtube.com/watch?v=5Hs7AfiMXgs'
    if ex['תרגיל'] == 'Single-leg Hip Thrust':
        ex['קישור יוטיוב'] = 'https://www.youtube.com/watch?v=kY0w0zFq08A'
        ex['קישור יוטיוב_link'] = 'https://www.youtube.com/watch?v=kY0w0zFq08A'

for day in data['daily']:
    for k, v in day.items():
        if isinstance(v, str):
            if k.endswith('קישור') or k.endswith('קישור_link'):
                if day.get(k.replace(' - קישור', ' - תרגיל').replace('_link', '')) == 'Copenhagen Plank':
                    day[k] = 'https://www.youtube.com/watch?v=5Hs7AfiMXgs'
                if day.get(k.replace(' - קישור', ' - תרגיל').replace('_link', '')) == 'Single-leg Hip Thrust':
                    day[k] = 'https://www.youtube.com/watch?v=kY0w0zFq08A'

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 2. Patch js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

old_block = """      // Check if plan is loaded
      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);
      if (planCount === 0 || exCount === 0) {
        // First load or partial load - import training data
        await DB.loadTrainingPlan();
      }"""

new_block = """      // Check if plan is loaded or needs update
      const currentDataVersion = 5; // Bumped to force reload for user
      const savedDataVersion = await DB.getSetting('dataVersion');
      
      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);
      
      if (planCount === 0 || exCount === 0 || savedDataVersion !== currentDataVersion) {
        console.log("Reloading training plan due to data version change or empty DB.");
        await DB.loadTrainingPlan();
        await DB.setSetting('dataVersion', currentDataVersion);
      }"""

if old_block in app_js:
    app_js = app_js.replace(old_block, new_block)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)
    print("Patched js/app.js")
else:
    print("Could not find block in js/app.js")

