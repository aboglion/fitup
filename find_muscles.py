from PIL import Image

def find_best_pixel(img_path, start_x, start_y, search_radius=10):
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    cx = int(w * start_x / 100)
    cy = int(h * start_y / 100)
    
    best_score = -9999
    best_x, best_y = start_x, start_y
    
    rx = int(w * search_radius / 100)
    ry = int(h * search_radius / 100)
    
    for y in range(max(0, cy-ry), min(h, cy+ry)):
        for x in range(max(0, cx-rx), min(w, cx+rx)):
            r, g, b = img.getpixel((x, y))
            # Skin is roughly red > green > blue.
            if r > g and r > b:
                # Score based on redness and overall brightness, but penalize distance from center slightly
                score = r * 2 - g - b - ((x-cx)**2 + (y-cy)**2)**0.5 * 0.1
                if score > best_score:
                    best_score = score
                    best_x = x / w * 100
                    best_y = y / h * 100
                    
    return round(best_x), round(best_y)

print("FRONT:")
front = {
    'Shoulders L': (40, 20), 'Shoulders R': (60, 20),
    'Chest L': (44, 25), 'Chest R': (56, 25),
    'Biceps L': (38, 30), 'Biceps R': (62, 30),
    'Forearms L': (34, 46), 'Forearms R': (66, 46),
    'Core': (50, 36),
    'Obliques L': (46, 45), 'Obliques R': (54, 45),
    'Quads L': (45, 62), 'Quads R': (55, 62),
}
for name, (ex, ey) in front.items():
    bx, by = find_best_pixel("images/anatomy-front.webp", ex, ey, 5)
    print(f"  {name:12}: X={bx}, Y={by}")

print("BACK:")
back = {
    'Traps L': (47, 20), 'Traps R': (53, 20),
    'Triceps L': (38, 34), 'Triceps R': (62, 34),
    'Lats L': (45, 32), 'Lats R': (55, 32),
    'LowerBack': (50, 48),
    'Glutes L': (46, 54), 'Glutes R': (54, 54),
    'Hamstrings L': (46, 65), 'Hamstrings R': (54, 65),
    'Calves L': (46, 78), 'Calves R': (54, 78),
}
for name, (ex, ey) in back.items():
    bx, by = find_best_pixel("images/anatomy-back.webp", ex, ey, 5)
    print(f"  {name:12}: X={bx}, Y={by}")
