from PIL import Image

def test_points(img_path, points):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    print(f"Testing {img_path}:")
    for name, x_pct, y_pct in points:
        x = int(w * x_pct / 100)
        y = int(h * y_pct / 100)
        r, g, b = img.getpixel((x, y))
        is_skin = r > g and r > 80 and b < 150
        print(f"  {name:12} ({x_pct}%, {y_pct}%): RGB({r:3}, {g:3}, {b:3}) - {'SKIN' if is_skin else 'BACKGROUND'}")

front = [
    ('Shoulders L', 42, 20), ('Shoulders R', 58, 20),
    ('Chest L', 46, 24), ('Chest R', 54, 24),
    ('Biceps L', 39, 30), ('Biceps R', 61, 30),
    ('Forearms L', 35, 44), ('Forearms R', 65, 44),
    ('Core', 50, 38),
    ('Obliques L', 46, 43), ('Obliques R', 54, 43),
    ('Quads L', 46, 60), ('Quads R', 54, 60),
]
test_points("images/anatomy-front.png", front)

back = [
    ('Traps L', 47, 20), ('Traps R', 53, 20),
    ('Triceps L', 40, 34), ('Triceps R', 60, 34),
    ('Lats L', 45, 32), ('Lats R', 55, 32),
    ('LowerBack', 50, 48),
    ('Glutes L', 46, 54), ('Glutes R', 54, 54),
    ('Hamstrings L', 46, 65), ('Hamstrings R', 54, 65),
    ('Calves L', 46, 78), ('Calves R', 54, 78),
]
test_points("images/anatomy-back.png", back)
