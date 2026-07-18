from PIL import Image

def get_body_bounds(img_path):
    img = Image.open(img_path).convert('L')
    pixels = img.load()
    w, h = img.size
    
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    
    for y in range(h):
        for x in range(w):
            if pixels[x, y] > 20: # Threshold for not completely black
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                
    print(f"{img_path}: X: {min_x/w*100:.1f}% to {max_x/w*100:.1f}%, Y: {min_y/h*100:.1f}% to {max_y/h*100:.1f}%")
    print(f"Center X: {(min_x+max_x)/2/w*100:.1f}%, Center Y: {(min_y+max_y)/2/h*100:.1f}%")
    print(f"Width: {(max_x-min_x)/w*100:.1f}%, Height: {(max_y-min_y)/h*100:.1f}%")

get_body_bounds("images/anatomy-front.png")
get_body_bounds("images/anatomy-back.png")
