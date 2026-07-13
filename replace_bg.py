import os
from PIL import Image
try:
    from rembg import remove
except ImportError:
    remove = None

def process_directory(directory):
    for filename in os.listdir(directory):
        if not filename.lower().endswith('.png'):
            continue
            
        filepath = os.path.join(directory, filename)
        try:
            with Image.open(filepath) as img:
                corner = img.getpixel((0,0))
                is_transp = (len(corner) == 4 and corner[3] == 0)
                # Distance from white
                dist = sum(abs(255 - c) for c in corner[:3])
                
                # Check if it has an alpha channel that has actual transparency
                has_alpha = False
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    has_alpha = True

                needs_rembg = False
                needs_white_bg = False

                if is_transp:
                    # It's transparent. Needs to be put on a white bg.
                    needs_white_bg = True
                elif dist > 30:
                    # It's a solid dark color. Needs rembg + white bg.
                    needs_rembg = True
                elif has_alpha:
                    # Maybe it's mostly white but has transparent parts we want white
                    extrema = img.getextrema()
                    if extrema[3][0] < 255: # min alpha < 255
                        needs_white_bg = True

            if needs_rembg:
                # Use rembg
                img = Image.open(filepath).convert("RGBA")
                if remove:
                    print(f"Using rembg on {filename}")
                    no_bg = remove(img)
                    white_bg = Image.new("RGBA", no_bg.size, (255, 255, 255, 255))
                    white_bg.paste(no_bg, (0, 0), no_bg)
                    white_bg.convert("RGB").save(filepath)
                    print(f"-> Done rembg + white bg for {filename}")
                else:
                    print(f"rembg needed but not found! Skipping {filename}")
            elif needs_white_bg:
                # Just composite on white
                img = Image.open(filepath).convert("RGBA")
                white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                white_bg.paste(img, (0, 0), img)
                white_bg.convert("RGB").save(filepath)
                print(f"-> Added white bg to {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == '__main__':
    d = '/home/uns/up/images/exercises'
    print(f"Processing images in {d}...")
    process_directory(d)
