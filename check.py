import os
from PIL import Image

d = '/home/uns/up/images/exercises'
for f in sorted(os.listdir(d))[:15]:
    try:
        img = Image.open(os.path.join(d, f))
        corner_pixel = img.getpixel((0,0))
        print(f'{f}: mode={img.mode}, size={img.size}, corner={corner_pixel}')
    except Exception as e:
        print(f'{f}: ERROR {e}')
