from PIL import Image, ImageDraw, ImageFont

def draw_grid(img_path, out_path):
    img = Image.open(img_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    # Draw 5% grid lines
    for i in range(0, 101, 5):
        x = int(w * i / 100)
        y = int(h * i / 100)
        # Vertical lines
        draw.line([(x, 0), (x, h)], fill='rgba(255,0,0,128)', width=1)
        # Horizontal lines
        draw.line([(0, y), (w, y)], fill='rgba(255,0,0,128)', width=1)
        
        # Draw labels every 10%
        if i % 10 == 0:
            draw.text((x + 2, 5), str(i), fill='red')
            draw.text((5, y + 2), str(i), fill='red')

    img.save(out_path)

draw_grid("images/anatomy-front.png", "/home/uns/.gemini/antigravity/brain/1e28185b-2c7b-401e-b5a2-e47b3a0074e8/front_grid.jpg")
draw_grid("images/anatomy-back.png", "/home/uns/.gemini/antigravity/brain/1e28185b-2c7b-401e-b5a2-e47b3a0074e8/back_grid.jpg")
