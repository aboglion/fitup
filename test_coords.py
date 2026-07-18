from PIL import Image, ImageDraw

def draw_points(img_path, out_path, points):
    img = Image.open(img_path)
    draw = ImageDraw.Draw(img)
    w, h = img.size
    for name, x_pct, y_pct in points:
        x = w * x_pct / 100
        y = h * y_pct / 100
        r = 5
        draw.ellipse((x-r, y-r, x+r, y+r), fill="red")
        draw.text((x+10, y-10), name, fill="red")
    img.save(out_path)

front_points = [
    ('chest-l', 44, 26), ('core', 50, 38), ('obliques-l', 40, 50),
    ('shoulders-r', 64, 18), ('biceps-r', 70, 33), ('forearm-r', 74, 46),
    ('quads-r', 57, 62), ('shoulders-l', 36, 18), ('chest-r', 56, 26),
    ('biceps-l', 30, 33), ('quads-l', 43, 62), ('obliques-r', 60, 50),
    ('forearm-l', 26, 46)
]
draw_points("images/anatomy-front.png", "front_test.jpg", front_points)

back_points = [
    ('traps-l', 45, 16), ('triceps-l', 28, 34), ('lowerBack', 50, 48),
    ('hamstrings-l', 43, 65), ('lats-r', 62, 28), ('glutes-r', 56, 52),
    ('calves-r', 57, 80), ('traps-r', 55, 16), ('lats-l', 38, 28),
    ('triceps-r', 72, 34), ('glutes-l', 44, 52), ('hamstrings-r', 57, 65),
    ('calves-l', 43, 80), ('midback', 50, 24)
]
draw_points("images/anatomy-back.png", "back_test.jpg", back_points)
