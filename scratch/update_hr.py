import re

with open('/home/uns/up/gs.js', 'r') as f:
    content = f.read()

# 1. handleTelegramMessage
content = content.replace('''    const heartRate = getCachedHeartRate24h();
    const heartPoints = getCachedHeartPoints24h();
    const energy = getCachedEnergyExpended24h();

    let aiResponse = askGeminiAI(
      text,
      fitupData,
      steps,
      sleep,
      imageData,
      heartRate,
      heartPoints,
      energy
    );''', '''    const heartPoints = getCachedHeartPoints24h();
    const energy = getCachedEnergyExpended24h();

    let aiResponse = askGeminiAI(
      text,
      fitupData,
      steps,
      sleep,
      imageData,
      heartPoints,
      energy
    );''')

# 2. askGeminiAI signature
content = content.replace('''function askGeminiAI(
  userMessage,
  fitupData,
  steps,
  sleep,
  imageData,
  heartRate,
  heartPoints,
  energy
)''', '''function askGeminiAI(
  userMessage,
  fitupData,
  steps,
  sleep,
  imageData,
  heartPoints,
  energy
)''')

# 3. askGeminiAI inside
content = content.replace('''  const systemPrompt = buildSystemPrompt(
    fitupData,
    steps,
    sleep,
    heartRate,
    heartPoints,
    energy
  );''', '''  const systemPrompt = buildSystemPrompt(
    fitupData,
    steps,
    sleep,
    heartPoints,
    energy
  );''')

# 4. buildSystemPrompt signature
content = content.replace('''function buildSystemPrompt(
  fitupData,
  steps,
  sleep,
  heartRate,
  heartPoints,
  energy
)''', '''function buildSystemPrompt(
  fitupData,
  steps,
  sleep,
  heartPoints,
  energy
)''')

# 5. buildSystemPrompt inside (regex to replace heartRate logic)
hr_prompt_regex = re.compile(r'  if \(heartRate && heartRate\.available\).*?else \{\s*prompt \+= "דופק ב-24 שעות: לא זמין\.\\n";\s*\}\n', re.DOTALL)
content = hr_prompt_regex.sub('', content)

# Update Heart Points explanation in buildSystemPrompt
content = content.replace('''  prompt +=
    "Heart Points ב-24 שעות: " +
    (
      heartPoints === null || heartPoints === undefined
        ? "לא זמין"
        : heartPoints
    ) +
    ".\\n";''', '''  prompt +=
    "Heart Points (נקודות לב - מדד מאמץ אירובי. לפחות 22 ליום זה טוב, מעל 40 זה אימון עצים): " +
    (
      heartPoints === null || heartPoints === undefined
        ? "לא זמין"
        : heartPoints
    ) +
    ". התייחס לזה במקום דופק כדי לנתח את העומס הקרדיו-וסקולרי שלו.\\n";''')

# 6. getAiContext24h
content = content.replace('''    const heartRate = getCachedHeartRate24h();
    const heartPoints = getCachedHeartPoints24h();''', '''    const heartPoints = getCachedHeartPoints24h();''')

content = content.replace('''        heartRateAvg: heartRate ? heartRate.avg : null,
        heartRateMin: heartRate ? heartRate.min : null,
        heartRateMax: heartRate ? heartRate.max : null,
        heartRateLast: heartRate ? heartRate.last : null,''', '')

# 7. buildStatusMessage
content = content.replace('''  const sleep = getCachedSleep();
  const heartRate = getCachedHeartRate24h();
  const heartPoints = getCachedHeartPoints24h();''', '''  const sleep = getCachedSleep();
  const heartPoints = getCachedHeartPoints24h();''')

hr_status_regex = re.compile(r'  if \(heartRate && heartRate\.available\).*?else \{\s*lines\.push\("דופק 24ש: לא זמין"\);\s*\}\n\n', re.DOTALL)
content = hr_status_regex.sub('', content)

# 8. frequentCheck
content = content.replace('''  const sleep = getCachedSleep();
  const heartRate = getCachedHeartRate24h();
  const heartPoints = getCachedHeartPoints24h();''', '''  const sleep = getCachedSleep();
  const heartPoints = getCachedHeartPoints24h();''')

hr_info_regex = re.compile(r'  const heartRateInfo =.*?;\n\n', re.DOTALL)
content = hr_info_regex.sub('', content)

content = content.replace('''    "דופק 24 שעות: " + heartRateInfo + ". " +
    "Heart Points 24 שעות: " +''', '''    "Heart Points 24 שעות: " +''')

content = content.replace('''    const aiResponse = askGeminiAI(
      instruction,
      fitupData,
      steps,
      sleep,
      null,
      heartRate,
      heartPoints,
      energy
    );''', '''    const aiResponse = askGeminiAI(
      instruction,
      fitupData,
      steps,
      sleep,
      null,
      heartPoints,
      energy
    );''')

# 9. testPrompt
content = content.replace('''  const heartRate = getCachedHeartRate24h();
  const heartPoints = getCachedHeartPoints24h();
  const energy = getCachedEnergyExpended24h();

  Logger.log(
    buildSystemPrompt(
      fitupData,
      steps,
      sleep,
      heartRate,
      heartPoints,
      energy
    )
  );''', '''  const heartPoints = getCachedHeartPoints24h();
  const energy = getCachedEnergyExpended24h();

  Logger.log(
    buildSystemPrompt(
      fitupData,
      steps,
      sleep,
      heartPoints,
      energy
    )
  );''')

# 10. forceClearCaches
content = content.replace('  props.deleteProperty("CACHED_HEART_RATE_24H");\n', '')

# 11. Remove Section 14 completely
section_14_regex = re.compile(r'// ============================================================\n// 14\. Google Fit — Heart Rate 24h.*?// ============================================================\n// 15\. Google Fit — Heart Points 24h', re.DOTALL)
content = section_14_regex.sub('// ============================================================\n// 15. Google Fit — Heart Points 24h', content)

with open('/home/uns/up/gs.js', 'w') as f:
    f.write(content)
