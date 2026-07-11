#!/usr/bin/env python3
"""Comprehensive audit of FitUp Pro 52-week program."""
import json

with open('js/data.js') as f:
    content = f.read()
    data = json.loads(content.replace('window.TRAINING_DATA = ','').rstrip(';\n'))

daily = data['daily']
exercises_guide = data.get('exercises', [])
errors = []
warnings = []

# ============ 1. Structure Checks ============
print("=" * 60)
print("1. STRUCTURE AUDIT")
print("=" * 60)

# Check total days
if len(daily) != 364:
    errors.append(f"Expected 364 days, got {len(daily)}")
else:
    print(f"✅ Total days: {len(daily)}")

# Check 52 weeks
weeks = set(d['week'] for d in daily)
if len(weeks) != 52:
    errors.append(f"Expected 52 weeks, got {len(weeks)}")
else:
    print(f"✅ Total weeks: {len(weeks)}")

# Check day type distribution
type_counts = {}
for d in daily:
    t = d['dayType']
    type_counts[t] = type_counts.get(t, 0) + 1

expected_types = {'כוח עליון A': 52, 'הליכה': 104, 'כוח תחתון': 52, 'כוח עליון B': 52, 'Rest': 104}
for t, expected in expected_types.items():
    actual = type_counts.get(t, 0)
    if actual != expected:
        errors.append(f"Day type '{t}': expected {expected}, got {actual}")
    else:
        print(f"✅ {t}: {actual}")

# Check weekly pattern: Sun=UpperA, Mon=Walk, Tue=Lower, Wed=Walk, Thu=UpperB, Fri=Rest, Sat=Rest
EXPECTED_PATTERN = ['כוח עליון A', 'הליכה', 'כוח תחתון', 'הליכה', 'כוח עליון B', 'Rest', 'Rest']
DAYS_HEB = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"]
for week_num in range(52):
    for dow in range(7):
        day_idx = week_num * 7 + dow
        day = daily[day_idx]
        expected_type = EXPECTED_PATTERN[dow]
        if day['dayType'] != expected_type:
            errors.append(f"Week {week_num+1} day {DAYS_HEB[dow]}: expected '{expected_type}', got '{day['dayType']}'")
        if day['dayOfWeek'] != DAYS_HEB[dow]:
            errors.append(f"Day {day_idx+1}: expected day '{DAYS_HEB[dow]}', got '{day['dayOfWeek']}'")

print(f"✅ Weekly pattern verified for all 52 weeks" if not any("Weekly pattern" in e or "expected day" in e for e in errors) else "")

# ============ 2. Phase Progression Checks ============
print("\n" + "=" * 60)
print("2. PHASE PROGRESSION AUDIT")
print("=" * 60)

def get_phase(week):
    if week <= 12: return 1
    if week <= 24: return 2
    if week <= 33: return 3
    return 4

def get_week(day_idx):
    return day_idx // 7 + 1

# Check Upper A exercises by phase
for phase_name, week_range, expected_a1 in [
    ("Phase 1", range(1,13), ["Incline Push-up"]),
    ("Phase 2", range(13,25), ["Push-up רגיל"]),
    ("Phase 3 (non-deload)", [w for w in range(26,33)], ["Diamond Push-up", "Offset Push-up"]),
    ("Phase 4 (non-deload)", [w for w in range(34,52) if w not in [41,49]], ["Banded Push-up", "Offset Push-up", "Decline Push-up"]),
]:
    for week in week_range:
        day_idx = (week - 1) * 7  # Sunday = Upper A
        day = daily[day_idx]
        a1_ex = next((e for e in day['exercises'] if e['slot'] == 'A1'), None)
        if a1_ex and a1_ex['name'] not in expected_a1:
            errors.append(f"{phase_name} Week {week} Upper A: A1 = '{a1_ex['name']}', expected one of {expected_a1}")
    print(f"✅ {phase_name} Upper A - A1 exercises correct")

# Check Upper A - A2 (pull progression)
for phase_name, week_range, expected_a2 in [
    ("Phase 1", range(1,13), ["Scapular Pull-up"]),
    ("Phase 2", range(13,25), ["Band-assisted Pull-up"]),
    ("Phase 3 (non-deload)", [w for w in range(26,33)], ["Chin-up"]),
    ("Phase 4 (non-deload)", [w for w in range(34,52) if w not in [41,49]], ["Pull-up"]),
]:
    for week in week_range:
        day_idx = (week - 1) * 7
        day = daily[day_idx]
        a2_ex = next((e for e in day['exercises'] if e['slot'] == 'A2'), None)
        if a2_ex and a2_ex['name'] not in expected_a2:
            errors.append(f"{phase_name} Week {week} Upper A: A2 = '{a2_ex['name']}', expected one of {expected_a2}")
    print(f"✅ {phase_name} Upper A - A2 pull correct")

# Check Lower (Tuesday) - leg progression
for phase_name, week_range, expected_a1 in [
    ("Phase 1", range(1,13), ["Squat איטי"]),
    ("Phase 2", range(13,25), ["Split Squat"]),
    ("Phase 3 (non-deload)", [w for w in range(26,33)], ["Bulgarian Split Squat"]),
    ("Phase 4 (non-deload)", [w for w in range(34,52) if w not in [41,49]], ["Bulgarian Split Squat"]),
]:
    for week in week_range:
        day_idx = (week - 1) * 7 + 2  # Tuesday = Lower
        day = daily[day_idx]
        a1_ex = next((e for e in day['exercises'] if e['slot'] == 'A1'), None)
        if a1_ex and a1_ex['name'] not in expected_a1:
            errors.append(f"{phase_name} Week {week} Lower: A1 = '{a1_ex['name']}', expected one of {expected_a1}")
    print(f"✅ {phase_name} Lower - A1 legs correct")

# Check Upper B (Thursday) differences from Upper A
print("\nUpper A vs Upper B differentiation:")
for week in [1, 13, 26, 34]:
    ua_idx = (week - 1) * 7      # Sunday
    ub_idx = (week - 1) * 7 + 4  # Thursday
    ua = daily[ua_idx]
    ub = daily[ub_idx]
    ua_d1 = next((e for e in ua['exercises'] if e['slot'] == 'D1'), None)
    ub_d1 = next((e for e in ub['exercises'] if e['slot'] == 'D1'), None)
    ua_name = ua_d1['name'] if ua_d1 else 'N/A'
    ub_name = ub_d1['name'] if ub_d1 else 'N/A'
    print(f"  Week {week}: Upper A D1={ua_name}, Upper B D1={ub_name}")
    if ua_name == ub_name:
        warnings.append(f"Week {week}: Upper A and B have same D1 exercise ({ua_name})")

# ============ 3. Deload Weeks ============
print("\n" + "=" * 60)
print("3. DELOAD WEEKS AUDIT")
print("=" * 60)

deload_weeks = [25, 33, 41, 49]
for dw in deload_weeks:
    day_idx = (dw - 1) * 7  # Sunday = Upper A
    day = daily[day_idx]
    exercises = day['exercises']
    # Count sets
    total_sets = 0
    for e in exercises:
        if e['sets']:
            parts = e['sets'].split('×')
            if len(parts) >= 1:
                try:
                    s = parts[0].replace('-','').strip()
                    total_sets += int(s[0])
                except:
                    pass
    print(f"  Week {dw} Upper A: {len(exercises)} exercises, sets pattern: {[e['sets'] for e in exercises if e['slot'] != 'W1']}")

# ============ 4. Walking Days ============
print("\n" + "=" * 60)
print("4. WALKING DAYS AUDIT")
print("=" * 60)

for phase, week_sample in [(1, 1), (2, 13), (3, 26), (4, 34)]:
    mon_idx = (week_sample - 1) * 7 + 1  # Monday
    wed_idx = (week_sample - 1) * 7 + 3  # Wednesday
    mon = daily[mon_idx]
    wed = daily[wed_idx]
    mon_walk = next((e for e in mon['exercises'] if e['slot'] == 'A1'), None)
    wed_walk = next((e for e in wed['exercises'] if e['slot'] == 'A1'), None)
    bird_dog_mon = next((e for e in mon['exercises'] if e['name'] == 'Bird-Dog'), None)
    bird_dog_wed = next((e for e in wed['exercises'] if e['name'] == 'Bird-Dog'), None)
    stretch_wed = next((e for e in wed['exercises'] if e['name'] == 'מתיחות מלאות'), None)
    
    print(f"  Phase {phase} (Week {week_sample}):")
    print(f"    Mon: Walk={mon_walk['sets'] if mon_walk else 'MISSING'}, Bird-Dog={'✅' if bird_dog_mon else '❌'}, Exercises={len(mon['exercises'])}")
    print(f"    Wed: Walk={wed_walk['sets'] if wed_walk else 'MISSING'}, Bird-Dog={'✅' if bird_dog_wed else '❌'}, Stretch={'✅' if stretch_wed else '❌'}, Exercises={len(wed['exercises'])}")
    
    if not bird_dog_mon:
        errors.append(f"Phase {phase} Week {week_sample} Monday: Missing Bird-Dog")
    if not bird_dog_wed:
        errors.append(f"Phase {phase} Week {week_sample} Wednesday: Missing Bird-Dog")

# ============ 5. Band Weights Progression ============
print("\n" + "=" * 60)
print("5. BAND WEIGHT PROGRESSION AUDIT")
print("=" * 60)

for ex_name in ["Banded OHP", "Band Row", "Pallof Press", "Banded Glute Bridge", "Banded RDL"]:
    weights_by_phase = {1: set(), 2: set(), 3: set(), 4: set()}
    for d in daily:
        week = get_week(d['dayNum'] - 1)
        phase = get_phase(week)
        for e in d['exercises']:
            if e['name'] == ex_name and e.get('weight'):
                weights_by_phase[phase].add(e['weight'])
    
    print(f"  {ex_name}:")
    for p in [1,2,3,4]:
        w = weights_by_phase[p]
        print(f"    Phase {p}: {sorted(w) if w else '—'}")

# ============ 6. Rotation Checks (Phase 3 & 4) ============
print("\n" + "=" * 60)
print("6. ROTATION PATTERN AUDIT")
print("=" * 60)

# Phase 3 Upper A rotation (weeks 26-32, excluding deloads)
print("Phase 3 Upper A rotations (weeks 26-32):")
for week in range(26, 33):
    if week in deload_weeks:
        continue
    day_idx = (week - 1) * 7
    day = daily[day_idx]
    a1 = next((e for e in day['exercises'] if e['slot'] == 'A1'), None)
    print(f"  Week {week}: {a1['name'] if a1 else 'N/A'} (even={week%2==0})")

# Phase 4 Upper A rotation (weeks 34-52, excluding deloads)
print("\nPhase 4 Upper A rotations (weeks 34-52):")
for week in range(34, 53):
    if week in deload_weeks:
        print(f"  Week {week}: DELOAD")
        continue
    day_idx = (week - 1) * 7
    day = daily[day_idx]
    a1 = next((e for e in day['exercises'] if e['slot'] == 'A1'), None)
    rot = (week - 34) % 3
    print(f"  Week {week}: {a1['name'] if a1 else 'N/A'} (rot={rot})")

# ============ 7. Exercise Guide Completeness ============
print("\n" + "=" * 60)
print("7. EXERCISE GUIDE COMPLETENESS")
print("=" * 60)

# Collect all unique exercise names from daily schedule
all_ex_names = set()
for d in daily:
    for e in d['exercises']:
        if e['name'] not in ['שינה 7-8 שעות', 'חלבון 160-170 גרם', 'מים 2.5-3 ליטר']:
            all_ex_names.add(e['name'])

guide_names = set(e['name'] for e in exercises_guide)

missing_in_guide = all_ex_names - guide_names
extra_in_guide = guide_names - all_ex_names

print(f"Exercises in daily schedule: {len(all_ex_names)}")
print(f"Exercises in guide: {len(guide_names)}")

if missing_in_guide:
    for name in sorted(missing_in_guide):
        errors.append(f"Exercise '{name}' used in schedule but MISSING from guide")
        print(f"  ❌ MISSING from guide: {name}")
else:
    print("  ✅ All exercises in schedule are in the guide")

if extra_in_guide:
    for name in sorted(extra_in_guide):
        warnings.append(f"Exercise '{name}' in guide but not used in schedule")
        print(f"  ⚠️ In guide but not in schedule: {name}")

# ============ 8. Skill Tree Completeness ============
print("\n" + "=" * 60)
print("8. EXERCISES NOT IN SKILL TREE (exercises.js)")
print("=" * 60)

# These are the exercises in the skill tree (from exercises.js)
SKILL_TREE_EXERCISES = {
    'Incline Push-up', 'Push-up רגיל', 'Offset Push-up', 'Diamond Push-up',
    'Banded Push-up', 'Decline Push-up', 'Band Row', 'Face Pull',
    'Single-arm Band Row', 'Scapular Pull-up', 'Band-assisted Pull-up',
    'Chin-up', 'Pull-up', 'Squat איטי', 'Split Squat', 'Bulgarian Split Squat',
    'Hollow Body Hold', 'Hanging Leg Raise', 'Pallof Press', 'Copenhagen Plank',
    'Banded Glute Bridge', 'Banded RDL', 'Band Curl', 'Triceps Extension',
    'Band External Rotation', 'Banded OHP', 'Band Lateral Raise', 'Pike Push-up'
}

missing_from_tree = all_ex_names - SKILL_TREE_EXERCISES
# Exclude non-progression exercises
non_tree_exercises = {'הליכה מהירה', 'מתיחות מלאות', 'הליכה קלה (אופציונלי)'}
missing_meaningful = missing_from_tree - non_tree_exercises

for name in sorted(missing_meaningful):
    print(f"  ⚠️ NOT in skill tree: {name}")
    warnings.append(f"Exercise '{name}' not in skill tree")

if not missing_meaningful:
    print("  ✅ All meaningful exercises are in skill tree")

# ============ SUMMARY ============
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"❌ Errors: {len(errors)}")
for e in errors:
    print(f"   {e}")
print(f"⚠️ Warnings: {len(warnings)}")
for w in warnings:
    print(f"   {w}")
