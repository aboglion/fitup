import sys
sys.path.insert(0, '/home/uns/fitup')
import generate_program

program = generate_program.generate_program()
daily = program['daily']
for day in daily[:7]:
    if day['dayType'] != 'Rest':
        print(day['Day Type'] if 'Day Type' in day else day['dayType'])
        for ex in day['exercises']:
            if ex['slot'].startswith('W'):
                print(f"  {ex['slot']}: {ex['name']}")
