import json

with open('/home/uns/.gemini/antigravity/brain/91dd007d-a215-4bb3-b647-6b961aaf2294/.system_generated/logs/overview.txt', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    if tc.get('name') == 'generate_image':
                        args = tc.get('args', {})
                        if 'Prompt' in args:
                            # It's double JSON encoded in the logs usually, or maybe just a string.
                            print("ImageName:", args.get('ImageName'))
                            print("Prompt:", args.get('Prompt'))
                            print("-" * 50)
                            import sys
                            sys.exit(0)
        except Exception as e:
            pass
