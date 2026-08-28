import re

with open("generate_program.py", "r", encoding="utf-8") as f:
    content = f.read()

# Update legalWeights array to include 25-32
content = content.replace(
    '"legalWeights": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],',
    '"legalWeights": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],'
)

# Update maxWeight: 24 to 32
content = content.replace('"maxWeight": 24,', '"maxWeight": 32,')
content = content.replace('"maxWeight": 18,', '"maxWeight": 20,')

with open("generate_program.py", "w", encoding="utf-8") as f:
    f.write(content)
