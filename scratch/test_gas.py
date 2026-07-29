import urllib.request
url = "https://script.google.com/macros/s/AKfycbyl5QDrn8Ak6GG0CuO-S-GEd1ZUn8FaGlQ8LQwW7kegmGiZpW3NyFOiX74WAeVWq-jG7w/exec"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("URL:", response.url)
        content = response.read()
        print("Length:", len(content))
        print("Content-Type:", response.headers.get('Content-Type'))
        if b'sandboxFrame' in content:
            print("Contains sandboxFrame iframe!")
        else:
            print(content[:200])
except Exception as e:
    print("Error:", e)
