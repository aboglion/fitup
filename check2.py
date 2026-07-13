import os
from PIL import Image

d = '/home/uns/up/images/exercises'
for f in os.listdir(d):
    if not f.endswith('.png'): continue
    try:
        img = Image.open(os.path.join(d, f))
        corner = img.getpixel((0,0))
        is_transp = (len(corner) == 4 and corner[3] == 0)
        dist = sum(abs(255 - c) for c in corner[:3])
        if not is_transp and dist > 30:
            print(f'{f}: {corner}')
    except Exception as e:
        print(f'{f}: ERROR {e}')
