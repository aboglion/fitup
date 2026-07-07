import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Installing...")
    os.system(f"{sys.executable} -m pip install pillow")
    from PIL import Image, ImageDraw, ImageFont

def main():
    img_path = "grid.png"
    if not os.path.exists(img_path):
        print("grid.png not found!")
        return

    img = Image.open(img_path)
    width, height = img.size
    
    rows = 4
    cols = 6
    cell_w = width / cols
    cell_h = height / rows

    # Mapping of (row, col) to exercise name and target filename
    # None means we skip it
    mapping = {
        (0,0): ("BOX SQUAT", "BOX SQUAT.png"),
        (0,1): ("BULGARIAN SPLIT SQUAT", "BULGARIAN SPLIT SQUAT.png"),
        (0,2): ("CHIN-UP", ["CHIN-UP.png", "CHIN-UP 2.png"]),
        (0,3): ("DEAD BUG", "DEAD BUG.png"),
        (0,4): ("DIAMOND PUSH-UP", "DIAMOND PUSH-UP.png"),
        (0,5): ("FACE PULL", "FACE PULL.png"),

        (1,0): ("HANGING LEG RAISE", "HANGING LEG RAISE.png"),
        (1,1): ("HOLLOW BODY HOLD", "HOLLOW BODY HOLD.png"),
        (1,2): ("INCLINE PUSH-UP", "INCLINE PUSH-UP.png"), # the 3rd image is the incline pushup
        (1,3): (None, None), # skip the 4th image (duplicate inverted row)
        (1,4): ("INVERTED ROW", "INVERTED ROW.png"),
        (1,5): ("NEGATIVE PULL-UP", "NEGATIVE PULL-UP.png"), # the 6th image is a pullup

        (2,0): ("PALLOF PRESS", "PALLOF PRESS.png"),
        (2,1): (None, None), # skip PAUOF PUSHUP
        (2,2): ("PIKE PUSH-UP", "PIKE PUSH-UP.png"),
        (2,3): ("PULL-UP", "PULL-UP.png"),
        (2,4): ("PUSH-UP", "PUSH-UP רגיל.png"),
        (2,5): ("REVERSE SNOW ANGEL", "REVERSE SNOW ANGEL.png"),

        (3,0): ("SCAPULAR PULL-UP", "SCAPULAR PULL-UP.png"),
        (3,1): ("SINGLE-LEG CALF RAISE", "SINGLE-LEG CALF RAISE.png"),
        (3,2): ("SPLIT SQUAT", "SPLIT SQUAT.png"),
        (3,3): ("SUPERMAN BACK EXTENSION", "SUPERMAN - BACK EXTENSION.png"),
        (3,4): ("TIBIALIS RAISE", "TIBIALIS RAISE.png"),
        (3,5): ("WALL PUSH-UP", "WALL PUSH-UP.png"),
    }

    out_dir = "images/exercises"
    os.makedirs(out_dir, exist_ok=True)
    
    font_size = int(cell_h * 0.08)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()

    for r in range(rows):
        for c in range(cols):
            if (r, c) not in mapping:
                continue
                
            entry = mapping[(r, c)]
            if entry[0] is None:
                continue
                
            text = entry[0]
            filenames = entry[1]
            if isinstance(filenames, str):
                filenames = [filenames]
                
            # Crop cell
            left = c * cell_w
            upper = r * cell_h
            right = (c + 1) * cell_w
            lower = (r + 1) * cell_h
            
            cell = img.crop((left + 2, upper + 2, right - 2, lower - 2))
            c_w, c_h = cell.size
            
            draw = ImageDraw.Draw(cell)
            
            # Paint white over top 18% to erase old text
            header_h = int(c_h * 0.18)
            draw.rectangle([0, 0, c_w, header_h], fill="white")
            
            # Write new text
            try:
                bbox = draw.textbbox((0,0), text, font=font)
                t_w = bbox[2] - bbox[0]
                t_h = bbox[3] - bbox[1]
                t_x = (c_w - t_w) / 2
                t_y = (header_h - t_h) / 2 - bbox[1]
            except AttributeError:
                t_w, t_h = draw.textsize(text, font=font)
                t_x = (c_w - t_w) / 2
                t_y = (header_h - t_h) / 2
                
            if t_x < 0: t_x = 0
            
            draw.text((t_x, t_y), text, font=font, fill="black")
            
            # Save files
            for fname in filenames:
                out_path = os.path.join(out_dir, fname)
                cell.save(out_path)
                print(f"Saved {out_path}")

if __name__ == '__main__':
    main()
