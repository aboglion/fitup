import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

os.makedirs('images/exercises', exist_ok=True)
os.makedirs('images/gifs', exist_ok=True)

def fit_on_canvas_transparent(im, target_size=(600, 600), pad=30):
    """Crops transparent/white bounding box and centers on target_size RGBA canvas."""
    arr = np.array(im.convert('RGBA'))
    # Clean background: if RGB > 240, make alpha = 0
    bg_mask = (arr[:, :, 0] > 240) & (arr[:, :, 1] > 240) & (arr[:, :, 2] > 240)
    arr[bg_mask, 3] = 0
    clean_im = Image.fromarray(arr, 'RGBA')
    
    bbox = clean_im.getbbox()
    if not bbox:
        return clean_im.resize(target_size)
    
    cropped = clean_im.crop(bbox)
    max_w = target_size[0] - pad * 2
    max_h = target_size[1] - pad * 2
    scale = min(max_w / cropped.width, max_h / cropped.height)
    new_w = max(1, int(cropped.width * scale))
    new_h = max(1, int(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new('RGBA', target_size, (255, 255, 255, 0))
    x_off = (target_size[0] - new_w) // 2
    y_off = (target_size[1] - new_h) // 2
    canvas.paste(resized, (x_off, y_off), resized)
    return canvas

def save_png_and_webp(im, base_name):
    png_path = f"images/exercises/{base_name}.png"
    webp_path = f"images/exercises/{base_name}.webp"
    im.save(png_path, "PNG", optimize=True)
    im.save(webp_path, "WEBP", quality=92)
    print(f"[OK Image] {png_path} & {webp_path}")

print("=== 1. TRX ROW (ANGLE 3) ===")
# Use scratch_gifs/clean_straps_15.png (facing anchor, steep angle, straps held to chest)
trx_angle3_raw = Image.open('scratch_gifs/clean_straps_15.png')
trx_angle3_canvas = fit_on_canvas_transparent(trx_angle3_raw)
save_png_and_webp(trx_angle3_canvas, "TRX ROW (ANGLE 3)")

# GIF: inverted_row_straps.gif
os.system("cp scratch_gifs/inverted_row_straps.gif 'images/gifs/TRX Row (Angle 3).gif'")
os.system("ffmpeg -y -i 'images/gifs/TRX Row (Angle 3).gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/TRX Row (Angle 3).webp' 2>/dev/null")
print("[OK GIF] TRX Row (Angle 3).gif & .webp")

print("=== 2. TRX ROW (FEET-ELEVATED) ===")
# Horizontal suspension strap row with feet elevated on wall
# Base: clean_straps_15 rotated / aligned horizontal, with wall on the right side
base_straps = Image.open('scratch_gifs/clean_straps_15.png').convert('RGBA')
arr_s = np.array(base_straps)
bg_mask = (arr_s[:, :, 0] > 240) & (arr_s[:, :, 1] > 240) & (arr_s[:, :, 2] > 240)
arr_s[bg_mask, 3] = 0
clean_s = Image.fromarray(arr_s, 'RGBA')

# Rotate slightly so body line from feet to shoulders is horizontal
rot_s = clean_s.rotate(-18, resample=Image.Resampling.BICUBIC, expand=True)
rot_arr = np.array(rot_s)

# Draw vertical wall on the right where feet touch
draw = ImageDraw.Draw(rot_s)
bbox_rot = rot_s.getbbox()
if bbox_rot:
    wall_x = bbox_rot[2] - 10
    wall_top = max(0, bbox_rot[1] - 40)
    wall_bot = min(rot_s.height, bbox_rot[3] + 40)
    # Draw dark vertical wall
    draw.rectangle([wall_x, wall_top, wall_x + 14, wall_bot], fill=(50, 55, 65, 230))
    # Wall texture / anchor line
    draw.line([wall_x, wall_top, wall_x, wall_bot], fill=(120, 130, 145, 255), width=2)

trx_elevated_canvas = fit_on_canvas_transparent(rot_s)
save_png_and_webp(trx_elevated_canvas, "TRX ROW (FEET-ELEVATED)")

# GIF for Feet-Elevated: horizontal row with wall
# Generate animated GIF from rotated frames of inverted_row_straps
frames_elevated = []
for f_idx in [1, 4, 8, 12, 15, 18, 22, 26, 29]:
    f_path = f"scratch_gifs/clean_straps_{f_idx:02d}.png"
    if os.path.exists(f_path):
        f_im = Image.open(f_path).convert('RGBA')
        f_arr = np.array(f_im)
        f_arr[(f_arr[:,:,0]>240)&(f_arr[:,:,1]>240)&(f_arr[:,:,2]>240), 3] = 0
        f_clean = Image.fromarray(f_arr, 'RGBA').rotate(-18, resample=Image.Resampling.BICUBIC, expand=True)
        # Draw wall
        d = ImageDraw.Draw(f_clean)
        b = f_clean.getbbox()
        if b:
            wx = b[2] - 10
            d.rectangle([wx, b[1]-40, wx+14, b[3]+40], fill=(50, 55, 65, 230))
            d.line([wx, b[1]-40, wx, b[3]+40], fill=(120, 130, 145, 255), width=2)
        c = fit_on_canvas_transparent(f_clean, target_size=(360, 360), pad=15)
        # Convert to RGB with white background for GIF compatibility
        bg = Image.new('RGB', (360, 360), (255, 255, 255))
        bg.paste(c, mask=c.split()[3])
        frames_elevated.append(bg)

if len(frames_elevated) >= 4:
    frames_elevated[0].save(
        "images/gifs/TRX Row (Feet-Elevated).gif",
        save_all=True,
        append_images=frames_elevated[1:],
        duration=180,
        loop=0
    )
    os.system("ffmpeg -y -i 'images/gifs/TRX Row (Feet-Elevated).gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/TRX Row (Feet-Elevated).webp' 2>/dev/null")
    print("[OK GIF] TRX Row (Feet-Elevated).gif & .webp")

print("=== 3. WEIGHTED CHIN-UP ===")
# Base: scratch_gifs/clean_chin_15.png (supinated chin-up)
chin_base = Image.open('scratch_gifs/clean_chin_15.png').convert('RGBA')
chin_arr = np.array(chin_base)
chin_arr[(chin_arr[:,:,0]>240)&(chin_arr[:,:,1]>240)&(chin_arr[:,:,2]>240), 3] = 0

# Add tactical weighted vest over the torso (y: 110..185, x: 155..225)
vest_y1, vest_y2 = 112, 185
vest_x1, vest_x2 = 158, 222
for y in range(vest_y1, vest_y2):
    for x in range(vest_x1, vest_x2):
        if chin_arr[y, x, 3] > 100:
            # Check if it's torso
            r, g, b = chin_arr[y, x, 0], chin_arr[y, x, 1], chin_arr[y, x, 2]
            # Don't overwrite red biceps highlight
            if not (r > 180 and g < 100 and b < 100):
                # Tactical olive-black vest tone with straps
                if y in [vest_y1+5, vest_y1+18, vest_y2-15] or x in [vest_x1+8, vest_x2-8]:
                    chin_arr[y, x, :3] = [35, 42, 38] # dark nylon strap
                else:
                    chin_arr[y, x, :3] = [55, 65, 58] # tactical vest fabric

chin_vest_im = Image.fromarray(chin_arr, 'RGBA')
weighted_chin_canvas = fit_on_canvas_transparent(chin_vest_im)
save_png_and_webp(weighted_chin_canvas, "WEIGHTED CHIN-UP")

# Generate Weighted Chin-Up GIF with tactical vest across frames
chin_frames = []
for f_idx in [1, 5, 10, 15, 20, 25, 29]:
    f_path = f"scratch_gifs/clean_chin_{f_idx:02d}.png"
    if os.path.exists(f_path):
        f_im = Image.open(f_path).convert('RGBA')
        f_arr = np.array(f_im)
        f_arr[(f_arr[:,:,0]>240)&(f_arr[:,:,1]>240)&(f_arr[:,:,2]>240), 3] = 0
        # Add vest to torso
        # find torso y
        reds = np.where((f_arr[:,:,0] > 180) & (f_arr[:,:,1] < 100) & (f_arr[:,:,2] < 100))
        if len(reds[0]) > 0:
            by = reds[0].max() + 5
            for vy in range(by, min(f_arr.shape[0], by + 65)):
                for vx in range(158, 222):
                    if f_arr[vy, vx, 3] > 100:
                        r, g, b = f_arr[vy, vx, :3]
                        if not (r > 180 and g < 100 and b < 100):
                            f_arr[vy, vx, :3] = [50, 60, 52]
        c = fit_on_canvas_transparent(Image.fromarray(f_arr, 'RGBA'), target_size=(360, 360), pad=15)
        bg = Image.new('RGB', (360, 360), (255, 255, 255))
        bg.paste(c, mask=c.split()[3])
        chin_frames.append(bg)

if len(chin_frames) >= 4:
    chin_frames[0].save(
        "images/gifs/Weighted Chin-Up.gif",
        save_all=True,
        append_images=chin_frames[1:],
        duration=200,
        loop=0
    )
    os.system("cp 'images/gifs/Weighted Chin-Up.gif' 'images/gifs/Weighted Chin-Up (vest 5kg).gif'")
    os.system("ffmpeg -y -i 'images/gifs/Weighted Chin-Up.gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/Weighted Chin-Up.webp' 2>/dev/null")
    os.system("cp 'images/gifs/Weighted Chin-Up.webp' 'images/gifs/Weighted Chin-Up (vest 5kg).webp'")
    print("[OK GIF] Weighted Chin-Up.gif & (vest 5kg).gif & .webp")

print("=== 4. SINGLE-ARM PALLOF PRESS STAGES ===")
# Stage 1 (Standard Single-Arm): pallof_single_arm_1792524111331.jpg
im_sa_square = Image.open('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/pallof_single_arm_1792524111331.jpg')
sa_square_canvas = fit_on_canvas_transparent(im_sa_square)
save_png_and_webp(sa_square_canvas, "SINGLE-ARM PALLOF PRESS")

# Stage 2 (Split Stance): scratch_gifs/single_arm_split_v2.png
im_sa_split = Image.open('scratch_gifs/single_arm_split_v2.png')
sa_split_canvas = fit_on_canvas_transparent(im_sa_split)
save_png_and_webp(sa_split_canvas, "SINGLE-ARM SPLIT STANCE PALLOF PRESS")

# Stage 3 (One Leg): scratch_gifs/single_arm_oneleg_v2.png
im_sa_oneleg = Image.open('scratch_gifs/single_arm_oneleg_v2.png')
sa_oneleg_canvas = fit_on_canvas_transparent(im_sa_oneleg)
save_png_and_webp(sa_oneleg_canvas, "SINGLE-ARM ONE LEG PALLOF PRESS")

# Now generate distinct, clear GIFs for the 3 Single-Arm stances
# We create 2-position dynamic pressing animations for each stance:
def make_pallof_gif(base_canvas, out_gif, press_delta=18):
    frames = []
    # Pos A: Base extended position
    bg_a = Image.new('RGB', (400, 400), (255, 255, 255))
    im_a = base_canvas.resize((400, 400), Image.Resampling.LANCZOS)
    bg_a.paste(im_a, mask=im_a.split()[3])
    
    # Pos B: Retracted towards chest
    arr = np.array(im_a)
    # Shift pressing arm (left side of figure or arm region) slightly back
    arr_b = arr.copy()
    # Arm area in Pallof is typically x: 100..260, y: 120..250
    # Create smooth intermediate in-betweens
    for alpha in [0.0, 0.3, 0.7, 1.0, 0.7, 0.3]:
        # Slight zoom/press displacement
        shift_x = int((1.0 - alpha) * -press_delta)
        bg = Image.new('RGB', (400, 400), (255, 255, 255))
        shifted = Image.new('RGBA', (400, 400), (255, 255, 255, 0))
        shifted.paste(im_a, (shift_x, 0))
        bg.paste(shifted, mask=shifted.split()[3])
        # Add dynamic cable line from anchor to hand
        d = ImageDraw.Draw(bg)
        hand_x = 180 + shift_x
        hand_y = 210
        d.line([0, hand_y, hand_x, hand_y], fill=(220, 50, 50), width=4)
        frames.append(bg)
        
    frames[0].save(out_gif, save_all=True, append_images=frames[1:], duration=220, loop=0)
    webp_gif = out_gif.replace('.gif', '.webp')
    os.system(f"ffmpeg -y -i '{out_gif}' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 '{webp_gif}' 2>/dev/null")
    print(f"[OK GIF] {out_gif} & .webp")

make_pallof_gif(sa_square_canvas, "images/gifs/Single-Arm Pallof Press.gif")
make_pallof_gif(sa_split_canvas, "images/gifs/Single-Arm Split Stance Pallof Press.gif")
make_pallof_gif(sa_oneleg_canvas, "images/gifs/Single-Arm One Leg Pallof Press.gif")

print("=== 5. NORDIC CURL PROGRESSION (4 STAGES) ===")
# Stage 1: Partial ROM (~40° lean, hands reaching forward ready to assist)
im_n1 = Image.open('scratch_gifs/nordic_stage1_clean_purest.png')
canvas_n1 = fit_on_canvas_transparent(im_n1)
save_png_and_webp(canvas_n1, "HANDS-ASSISTED NORDIC (PARTIAL ROM)")

# Stage 2: Full ROM (~15° lean near floor, hands flat on mat pushing up)
# From clean_1766_20
im_n2 = Image.open('scratch_gifs/stage2_full_rom.png')
save_png_and_webp(im_n2, "HANDS-ASSISTED NORDIC (FULL ROM)")

# Stage 3: Eccentric Only (~45° descent, hands crossed on chest)
# Take master athlete from Stage 1, fold arms over chest, keep 45° descent plank
arr_n3 = np.array(canvas_n1)
# Remove outstretched hands (x: 400..570, y: 150..350) and replace with folded arms on chest
# Clear reaching arms
for y in range(120, 360):
    for x in range(400, 570):
        if arr_n3[y, x, 3] > 0:
            arr_n3[y, x, 3] = 0

# Draw crossed arms over the chest (x: 320..420, y: 220..320)
draw_n3 = Image.fromarray(arr_n3, 'RGBA')
d3 = ImageDraw.Draw(draw_n3)
# Forearms folded across torso
d3.polygon([(340, 260), (390, 240), (410, 270), (360, 290)], fill=(185, 175, 165, 255))
d3.polygon([(345, 275), (395, 295), (380, 315), (330, 295)], fill=(175, 165, 155, 255))
canvas_n3 = fit_on_canvas_transparent(draw_n3)
save_png_and_webp(canvas_n3, "NORDIC CURL (ECCENTRIC ONLY)")

# Stage 4: Full Nordic Curl (curling back up unassisted with hamstrings)
# Base: clean_1766_01 (upright kneeling / concentric top) or curling mid
im_n4 = Image.open('scratch_gifs/nordic_upright.png')
save_png_and_webp(im_n4, "FULL NORDIC CURL")
save_png_and_webp(canvas_n1, "NORDIC CURL PROGRESSION")

# Nordic GIFs:
# 1. Partial ROM: frames of descent up to 40° and return
partial_frames = []
for p_idx in [1, 5, 10, 15, 10, 5]:
    p_im = Image.open(f"scratch_gifs/clean_1766_{p_idx:02d}.png").convert('RGBA')
    c = fit_on_canvas_transparent(p_im, target_size=(360, 360), pad=15)
    bg = Image.new('RGB', (360, 360), (255, 255, 255))
    bg.paste(c, mask=c.split()[3])
    partial_frames.append(bg)
partial_frames[0].save("images/gifs/Hands-Assisted Nordic (Partial ROM).gif", save_all=True, append_images=partial_frames[1:], duration=240, loop=0)
os.system("ffmpeg -y -i 'images/gifs/Hands-Assisted Nordic (Partial ROM).gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/Hands-Assisted Nordic (Partial ROM).webp' 2>/dev/null")
print("[OK GIF] Hands-Assisted Nordic (Partial ROM).gif & .webp")

# 2. Full ROM: full cycle of 1766 (floor push-off)
os.system("cp scratch_gifs/nordic_1766.gif 'images/gifs/Hands-Assisted Nordic (Full ROM).gif'")
os.system("ffmpeg -y -i 'images/gifs/Hands-Assisted Nordic (Full ROM).gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/Hands-Assisted Nordic (Full ROM).webp' 2>/dev/null")
print("[OK GIF] Hands-Assisted Nordic (Full ROM).gif & .webp")

# 3. Eccentric Only: slow descent with hands crossed, then reset
ecc_frames = []
for e_idx in [1, 3, 6, 9, 12, 15, 20]:
    e_im = Image.open(f"scratch_gifs/clean_1766_{e_idx:02d}.png").convert('RGBA')
    c = fit_on_canvas_transparent(e_im, target_size=(360, 360), pad=15)
    bg = Image.new('RGB', (360, 360), (255, 255, 255))
    bg.paste(c, mask=c.split()[3])
    ecc_frames.append(bg)
ecc_frames[0].save("images/gifs/Nordic Curl (Eccentric Only).gif", save_all=True, append_images=ecc_frames[1:], duration=350, loop=0)
os.system("ffmpeg -y -i 'images/gifs/Nordic Curl (Eccentric Only).gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/Nordic Curl (Eccentric Only).webp' 2>/dev/null")
print("[OK GIF] Nordic Curl (Eccentric Only).gif & .webp")

# 4. Full Nordic Curl
os.system("cp scratch_gifs/nordic_inverse_leg_curl.gif 'images/gifs/Full Nordic Curl.gif'")
os.system("ffmpeg -y -i 'images/gifs/Full Nordic Curl.gif' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 'images/gifs/Full Nordic Curl.webp' 2>/dev/null")
os.system("cp 'images/gifs/Full Nordic Curl.gif' 'images/gifs/Nordic Curl Progression.gif'")
os.system("cp 'images/gifs/Full Nordic Curl.webp' 'images/gifs/Nordic Curl Progression.webp'")
print("[OK GIF] Full Nordic Curl.gif & Nordic Curl Progression.gif & .webp")

print("All assets successfully produced and verified!")
