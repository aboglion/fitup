#!/bin/bash
# Comprehensive Exercise-to-Asset Mapping Audit
# Checks PNG and GIF linkage for all exercises in the Skill Tree

echo "=============================================="
echo " FitUp Exercise ↔ Asset Integrity Audit"
echo "=============================================="
echo ""

cd /home/uns/fitup

# All exercise names from SKILL_TREES in exercises.js
EXERCISES=(
  # Lower Strength - Warmup
  "High Knees"
  "Deep Mobility Protocol"
  "Micro Mobility Protocol"
  "Wrist Rocks"
  # Lower Strength - Squat/Lunge
  "Bodyweight Squat"
  "DB Bulgarian Split Squat"
  "Reverse Lunge + DB"
  "DB BSS (Goblet)"
  "Pistol Squat Progression"
  "Walking Lunge (Goblet)"
  # Lower Strength - Hamstring
  "DB Romanian Deadlift"
  "Single-Leg RDL"
  # Lower Strength - Glutes/Calves
  "Glute Bridge"
  "DB Glute Bridge"
  "DB Hip Thrust"
  "Standing Single-Leg Calf Raise"
  "Seated Single-Leg Calf Raise"
  # Lower Strength - Core
  "Dead Bug"
  "Hollow Body Hold"
  "Suitcase Carry"
  "Pallof Press Progression"
  # Upper Push - Warmup
  "Arm Circles"
  "Wall Slides"
  "Scapular Push-up"
  "Band Pull-Apart"
  # Upper Push - Push Tree
  "Push-up Bars Progression"
  "DB Floor Press"
  "Push-Up Volume (Day 5)"
  "Diamond Push-Up"
  "Deficit Push-Up"
  "Feet-Elevated Push-Up"
  "Single-Arm Floor Press"
  "Weighted Deficit Push-Up"
  # Upper Push - Overhead Skill
  "Pike Progression"
  "Seated DB Overhead Press"
  "Wall Walk (Partial)"
  "Wall Walk (Full)"
  "Wall Handstand"
  "Elevated Pike Push-Up"
  "Single-Arm Seated OHP"
  # Upper Push - Accessory
  "DB Lateral Raise"
  "DB Overhead Triceps Extension"
  "TRX Y-T-W"
  "Arm Block - DB Lateral Raise"
  "Arm Block - DB Overhead Triceps Ext"
  # Upper Pull - Warmup
  # (Wall Slides, already listed)
  "Scapular Pull-up"
  "Dead Hang"
  # Upper Pull - Pull-up Tree
  "Pull-Up Progression"
  "Chin-Up Progression"
  "Pull-Up (Overhand)"
  "Chin-Up"
  "Weighted Pull-Up"
  "Weighted Chin-Up"
  # Upper Pull - Rows
  "TRX Row"
  "Seated Band Row"
  "One-Arm DB Row"
  "TRX Face Pull"
  # Upper Pull - Biceps/Grip
  "DB Curl"
  "Hammer Curl"
  "Arm Block - DB Curl"
  "Single-Arm Curl"
  "Towel Hang"
  # Upper Pull - Hanging Core
  "L-Sit Progression"
  # Cardio
  "Relaxed Walking"
  "Brisk Walking"
  "VO2 Max Norwegian 4x4"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SECTION 1: Exercise → PNG Mapping"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PNG_OK=0
PNG_ALIAS=0
PNG_MISS=0
PNG_RESULTS=""

for ex in "${EXERCISES[@]}"; do
  # Primary path: exercise name uppercase + .png
  upper_name=$(echo "$ex" | tr '[:lower:]' '[:upper:]' | sed 's|/|-|g')
  primary_path="images/exercises/${upper_name}.png"
  
  if [ -f "$primary_path" ]; then
    PNG_RESULTS+="✅ ${ex} → ${primary_path}\n"
    ((PNG_OK++))
  else
    # Check common aliases (from EXERCISE_PNG_ALIASES logic)
    found=0
    # Try alternative filenames
    case "$ex" in
      "Push-up Bars Progression") alt="images/exercises/PUSH-UP (BARS).png" ;;
      "Push-Up Volume (Day 5)") alt="images/exercises/PUSH-UP VOLUME (DAY 5).png" ;;
      "Scapular Push-up") alt="images/exercises/SCAPULAR PUSH-UP.png" ;;
      "Scapular Pull-up") alt="images/exercises/SCAPULAR PULL-UP.png" ;;
      "Pike Progression") alt="images/exercises/PIKE PROGRESSION.png" ;;
      "Pull-Up Progression") alt="images/exercises/PULL-UP PROGRESSION.png" ;;
      "Chin-Up Progression") alt="images/exercises/CHIN-UP PROGRESSION.png" ;;
      "Pistol Squat Progression") alt="images/exercises/PISTOL SQUAT PROGRESSION.png" ;;
      "Pallof Press Progression") alt="images/exercises/PALLOF PRESS PROGRESSION.png" ;;
      "L-Sit Progression") alt="images/exercises/L-SIT PROGRESSION.png" ;;
      "Arm Block - DB Overhead Triceps Ext") alt="images/exercises/ARM BLOCK - DB OH TRICEPS EXT.png" ;;
      *) alt="" ;;
    esac
    
    if [ -n "$alt" ] && [ -f "$alt" ]; then
      PNG_RESULTS+="🔗 ${ex} → ${alt} (alias)\n"
      ((PNG_ALIAS++))
      found=1
    fi
    
    if [ $found -eq 0 ]; then
      # Try with PUSH-UP style hyphens
      hyphen_name=$(echo "$upper_name" | sed 's/ UP/-UP/g')
      alt2="images/exercises/${hyphen_name}.png"
      if [ -f "$alt2" ]; then
        PNG_RESULTS+="🔗 ${ex} → ${alt2} (auto-resolved)\n"
        ((PNG_ALIAS++))
      else
        PNG_RESULTS+="❌ ${ex} → MISSING (expected: ${primary_path})\n"
        ((PNG_MISS++))
      fi
    fi
  fi
done

echo -e "$PNG_RESULTS"
echo ""
echo "PNG Summary: ✅ ${PNG_OK} direct | 🔗 ${PNG_ALIAS} via alias | ❌ ${PNG_MISS} missing"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SECTION 2: Exercise → GIF Mapping"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GIF_OK=0
GIF_ALIAS=0
GIF_MISS=0
GIF_SKIP=0
GIF_RESULTS=""

for ex in "${EXERCISES[@]}"; do
  # These exercises have no GIF by design (NO_GIF_EXERCISES)
  case "$ex" in
    "Brisk Walking"|"Relaxed Walking"|"VO2 Max Norwegian 4x4")
      GIF_RESULTS+="⏭️  ${ex} → [no GIF by design]\n"
      ((GIF_SKIP++))
      continue
      ;;
  esac
  
  # Primary path: exercise name exact + .gif
  primary_path="images/gifs/${ex}.gif"
  
  if [ -f "$primary_path" ]; then
    GIF_RESULTS+="✅ ${ex} → ${primary_path}\n"
    ((GIF_OK++))
  else
    # Check GIF aliases from EXERCISE_GIF_ALIASES
    found=0
    upper_clean=$(echo "$ex" | tr '[:lower:]' '[:upper:]' | sed 's/[-_]/ /g')
    
    case "$ex" in
      "Chin-Up Progression") alt="images/gifs/Chin-Up Progression.gif" ;;
      "Pull-Up Progression") alt="images/gifs/Pull-Up Progression.gif" ;;
      "Pull-Up (Overhand)") alt="images/gifs/Pull-Up (Overhand).gif" ;;
      "Chin-Up") alt="images/gifs/Chin-Up.gif" ;;
      "Scapular Push-up") alt="images/gifs/Scapular Push-up.gif" ;;
      "Scapular Pull-up") alt="images/gifs/Scapular Pull-up.gif" ;;
      "Push-up Bars Progression") alt="images/gifs/Push-up Bars Progression.gif" ;;
      "Push-Up Volume (Day 5)") alt="images/gifs/Push-Up Volume (Day 5).gif" ;;
      "Elevated Pike Push-Up") alt="images/gifs/Elevated Pike Push-Up.gif" ;;
      "Pike Progression") alt="images/gifs/Pike Progression.gif" ;;
      "Pistol Squat Progression") alt="images/gifs/Pistol Squat Progression.gif" ;;
      "Pallof Press Progression") alt="images/gifs/Pallof Press Progression.gif" ;;
      "L-Sit Progression") alt="images/gifs/L-Sit Progression.gif" ;;
      "DB Romanian Deadlift") alt="images/gifs/DB Romanian Deadlift.gif" ;;
      "Arm Block - DB Overhead Triceps Ext") alt="images/gifs/Arm Block - DB OH Triceps Ext.gif" ;;
      "DB Overhead Triceps Extension") alt="images/gifs/DB Overhead Triceps Extension.gif" ;;
      "Micro Mobility Protocol") alt="images/gifs/Deep Mobility Protocol.gif" ;; 
      *) alt="" ;;
    esac
    
    if [ -n "$alt" ] && [ -f "$alt" ]; then
      GIF_RESULTS+="🔗 ${ex} → ${alt} (alias)\n"
      ((GIF_ALIAS++))
      found=1
    fi
    
    if [ $found -eq 0 ]; then
      # Try case variations
      alt_camel="images/gifs/${ex}.gif"
      if [ -f "$alt_camel" ]; then
        GIF_RESULTS+="🔗 ${ex} → ${alt_camel} (case match)\n"
        ((GIF_ALIAS++))
      else
        GIF_RESULTS+="❌ ${ex} → MISSING (expected: ${primary_path})\n"
        ((GIF_MISS++))
      fi
    fi
  fi
done

echo -e "$GIF_RESULTS"
echo ""
echo "GIF Summary: ✅ ${GIF_OK} direct | 🔗 ${GIF_ALIAS} via alias | ❌ ${GIF_MISS} missing | ⏭️ ${GIF_SKIP} no-GIF-by-design"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SECTION 3: Orphan Files (no exercise reference)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# List all PNG files and check if any don't correspond to known exercises
ORPHAN_PNG=0
ORPHAN_GIF=0

echo "--- Orphan PNGs ---"
for f in images/exercises/*.png; do
  basename=$(basename "$f" .png)
  # Check if this basename matches any exercise (case-insensitive comparison)
  matched=0
  for ex in "${EXERCISES[@]}"; do
    upper_ex=$(echo "$ex" | tr '[:lower:]' '[:upper:]' | sed 's|/|-|g')
    if [ "$basename" = "$upper_ex" ]; then
      matched=1
      break
    fi
  done
  if [ $matched -eq 0 ]; then
    # Check if it's a known alias/duplicate
    echo "  📦 ${basename}.png (not in Skill Tree)"
    ((ORPHAN_PNG++))
  fi
done
echo ""
echo "--- Orphan GIFs ---"
for f in images/gifs/*.gif; do
  base=$(basename "$f" .gif)
  matched=0
  for ex in "${EXERCISES[@]}"; do
    if [ "$base" = "$ex" ]; then
      matched=1
      break
    fi
  done
  if [ $matched -eq 0 ]; then
    echo "  📦 ${base}.gif (not in Skill Tree)"
    ((ORPHAN_GIF++))
  fi
done

echo ""
echo "Orphans: ${ORPHAN_PNG} PNG files | ${ORPHAN_GIF} GIF files not directly matching Skill Tree exercises"
echo "(Note: Some orphans are aliases/duplicates used by the fallback system)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SECTION 4: File Integrity (corrupt/empty files)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CORRUPT=0
for f in images/exercises/*.png; do
  size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null)
  if [ "$size" -lt 1000 ]; then
    echo "  ⚠️  CORRUPT/TINY: $f (${size} bytes)"
    ((CORRUPT++))
  fi
  # Check if file is actually a JPEG in disguise
  magic=$(head -c 4 "$f" | xxd -p 2>/dev/null || echo "unknown")
  if [[ "$magic" == "ffd8ff"* ]]; then
    echo "  ⚠️  WRONG FORMAT: $f is JPEG, not PNG"
    ((CORRUPT++))
  fi
done

for f in images/gifs/*.gif; do
  size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null)
  if [ "$size" -lt 1000 ]; then
    echo "  ⚠️  CORRUPT/TINY: $f (${size} bytes)"
    ((CORRUPT++))
  fi
  magic=$(head -c 4 "$f" | xxd -p 2>/dev/null || echo "unknown")
  if [[ "$magic" == "ffd8ff"* ]]; then
    echo "  ⚠️  WRONG FORMAT: $f is JPEG, not GIF"
    ((CORRUPT++))
  fi
done

if [ $CORRUPT -eq 0 ]; then
  echo "  ✅ All files have valid format and size"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SECTION 5: Duplicate File Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "--- Duplicate PNGs (same file size) ---"
# Find PNGs with identical sizes (likely duplicates)
for f1 in images/exercises/*.png; do
  s1=$(stat -c%s "$f1" 2>/dev/null)
  b1=$(basename "$f1")
  for f2 in images/exercises/*.png; do
    b2=$(basename "$f2")
    if [[ "$b1" < "$b2" ]]; then
      s2=$(stat -c%s "$f2" 2>/dev/null)
      if [ "$s1" = "$s2" ]; then
        echo "  🔄 $b1 ≡ $b2 (${s1} bytes)"
      fi
    fi
  done
done

echo ""
echo "--- Duplicate GIFs (same file size) ---"
for f1 in images/gifs/*.gif; do
  s1=$(stat -c%s "$f1" 2>/dev/null)
  b1=$(basename "$f1")
  for f2 in images/gifs/*.gif; do
    b2=$(basename "$f2")
    if [[ "$b1" < "$b2" ]]; then
      s2=$(stat -c%s "$f2" 2>/dev/null)
      if [ "$s1" = "$s2" ]; then
        echo "  🔄 $b1 ≡ $b2 (${s1} bytes)"
      fi
    fi
  done
done

echo ""
echo "=============================================="
echo " AUDIT COMPLETE"
echo "=============================================="
