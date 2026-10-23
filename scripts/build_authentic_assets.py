import os, sys, subprocess
import numpy as np
from PIL import Image
from collections import deque

os.makedirs('images/exercises', exist_ok=True)
os.makedirs('images/gifs', exist_ok=True)

def isolate_white_background(img_path, threshold=242):
    """Flood-fills from borders to isolate subject on transparent canvas without touching internal highlights."""
    im = Image.open(img_path).convert('RGB')
    w, h = im.size
    arr = np.array(im)
    
    is_white = np.all(arr >= threshold, axis=-1)
    visited = np.zeros((h, w), dtype=bool)
    bg_mask = np.zeros((h, w), dtype=bool)
    
    q = deque()
    for x in range(w):
        if is_white[0, x]: q.append((0, x)); visited[0, x] = True
        if is_white[h-1, x]: q.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if is_white[y, 0] and not visited[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_white[y, w-1] and not visited[y, w-1]: q.append((y, w-1)); visited[y, w-1] = True
        
    while q:
        cy, cx = q.popleft()
        bg_mask[cy, cx] = True
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if is_white[ny, nx]:
                    q.append((ny, nx))
                    
    fg_mask = ~bg_mask
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = arr
    
    alpha = np.zeros((h, w), dtype=np.uint8)
    alpha[fg_mask] = 255
    
    # Smooth antialiasing on outer borders
    border = fg_mask & np.any(arr > 220, axis=-1)
    diff = 255.0 - np.mean(arr[border], axis=-1)
    smooth_alpha = np.clip(diff / 35.0 * 255.0, 0, 255).astype(np.uint8)
    alpha[border] = smooth_alpha
    
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, 'RGBA')

def fit_on_canvas_transparent(clean_im, target_size=(600, 600), pad=30):
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

def save_exercise_image(im, base_name):
    png_path = f"images/exercises/{base_name}.png"
    webp_path = f"images/exercises/{base_name}.webp"
    im.save(png_path, "PNG", optimize=True)
    im.save(webp_path, "WEBP", quality=92)
    print(f"[OK Image] {png_path} & {webp_path}")

def convert_gif_to_webp(gif_path):
    webp_path = gif_path.replace('.gif', '.webp')
    cmd = f"ffmpeg -y -i '{gif_path}' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 '{webp_path}' 2>/dev/null"
    subprocess.run(cmd, shell=True)
    print(f"[OK WebP Animation] {webp_path}")

print("=== 1. PROCESSING NORDIC CURL IMAGES ===")
# Partial ROM & Master
im_partial_raw = Image.open('/tmp/true_orig_nordic.png').convert('RGBA')
canvas_nordic_master = fit_on_canvas_transparent(im_partial_raw)
save_exercise_image(canvas_nordic_master, "HANDS-ASSISTED NORDIC (PARTIAL ROM)")
save_exercise_image(canvas_nordic_master, "NORDIC CURL PROGRESSION")

# Full ROM
im_n_full = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/nordic_full_rom_ecorche_1792713193104.jpg')
canvas_n_full = fit_on_canvas_transparent(im_n_full)
save_exercise_image(canvas_n_full, "HANDS-ASSISTED NORDIC (FULL ROM)")

# Eccentric Only
im_n_ecc = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/nordic_eccentric_ecorche_1792713170498.jpg')
canvas_n_ecc = fit_on_canvas_transparent(im_n_ecc)
save_exercise_image(canvas_n_ecc, "NORDIC CURL (ECCENTRIC ONLY)")

# Full Nordic Curl
im_n_curl = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/nordic_full_curl_ecorche_1792713214226.jpg')
canvas_n_curl = fit_on_canvas_transparent(im_n_curl)
save_exercise_image(canvas_n_curl, "FULL NORDIC CURL")


print("=== 2. PROCESSING SINGLE-ARM PALLOF PRESS IMAGES ===")
# Square Stance
im_sa_sq = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/pallof_single_arm_square_1792713243573.jpg')
canvas_sa_sq = fit_on_canvas_transparent(im_sa_sq)
save_exercise_image(canvas_sa_sq, "SINGLE-ARM PALLOF PRESS")

# Split Stance
im_sa_split = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/pallof_single_arm_split_1792713270763.jpg')
canvas_sa_split = fit_on_canvas_transparent(im_sa_split)
save_exercise_image(canvas_sa_split, "SINGLE-ARM SPLIT STANCE PALLOF PRESS")

# One Leg Stance
im_sa_oneleg = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/pallof_single_arm_oneleg_1792713295484.jpg')
canvas_sa_oneleg = fit_on_canvas_transparent(im_sa_oneleg)
save_exercise_image(canvas_sa_oneleg, "SINGLE-ARM ONE LEG PALLOF PRESS")


print("=== 3. PROCESSING TRX ROW IMAGES ===")
# Angle 3 (35 deg incline)
im_trx_ang3 = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/trx_incline_35deg_1792713409494.jpg')
canvas_trx_ang3 = fit_on_canvas_transparent(im_trx_ang3)
save_exercise_image(canvas_trx_ang3, "TRX ROW (ANGLE 3)")

# Feet-Elevated (horizontal on gym wall)
im_trx_elev = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/trx_feet_elevated_1792713349253.jpg')
canvas_trx_elev = fit_on_canvas_transparent(im_trx_elev)
save_exercise_image(canvas_trx_elev, "TRX ROW (FEET-ELEVATED)")


print("=== 4. PROCESSING WEIGHTED CHIN-UP IMAGE ===")
# 600x269 canvas matching CHIN-UP.png
im_wchin = isolate_white_background('/home/uns/.gemini/antigravity-ide/brain/be4d0874-6857-43b6-8d9b-0585426fc46c/weighted_chin_up_ecorche_1792713457334.jpg')
canvas_wchin = fit_on_canvas_transparent(im_wchin, target_size=(600, 269), pad=15)
save_exercise_image(canvas_wchin, "WEIGHTED CHIN-UP")


print("=== 5. PROCESSING FOOT-SUPPORTED L-SIT IMAGE ===")
im_lsit_curr = Image.open('images/exercises/FOOT-SUPPORTED L-SIT.png').convert('RGBA')
arr_l = np.array(im_lsit_curr)
# Clean any floor shadow/gradient: if y > 460 and alpha > 0, check if it's the floor plane
for y in range(480, arr_l.shape[0]):
    for x in range(arr_l.shape[1]):
        # Remove faint floor shadow (y > 480 and x outside the parallette feet)
        if arr_l[y, x, 3] > 0:
            r, g, b = arr_l[y, x, :3]
            if (r > 160 and g > 150 and b > 140) and arr_l[y, x, 3] < 120:
                arr_l[y, x, 3] = 0
clean_lsit = fit_on_canvas_transparent(Image.fromarray(arr_l, 'RGBA'))
save_exercise_image(clean_lsit, "FOOT-SUPPORTED L-SIT")


print("=== 6. PROCESSING ALL GIF ANIMATIONS ===")
# Nordic Curl GIFs
subprocess.run("cp /tmp/test_n_partial.gif 'images/gifs/Hands-Assisted Nordic (Partial ROM).gif'", shell=True)
convert_gif_to_webp('images/gifs/Hands-Assisted Nordic (Partial ROM).gif')

subprocess.run("cp /tmp/test_n_fullrom.gif 'images/gifs/Hands-Assisted Nordic (Full ROM).gif'", shell=True)
convert_gif_to_webp('images/gifs/Hands-Assisted Nordic (Full ROM).gif')

subprocess.run("cp /tmp/test_n_ecc.gif 'images/gifs/Nordic Curl (Eccentric Only).gif'", shell=True)
convert_gif_to_webp('images/gifs/Nordic Curl (Eccentric Only).gif')

subprocess.run("cp /tmp/test_n_unassisted.gif 'images/gifs/Full Nordic Curl.gif'", shell=True)
convert_gif_to_webp('images/gifs/Full Nordic Curl.gif')

subprocess.run("cp /tmp/test_n_fullrom.gif 'images/gifs/Nordic Curl Progression.gif'", shell=True)
convert_gif_to_webp('images/gifs/Nordic Curl Progression.gif')

# Pallof Press GIFs
subprocess.run("cp /tmp/test_pallof_sa_square.gif 'images/gifs/Single-Arm Pallof Press.gif'", shell=True)
convert_gif_to_webp('images/gifs/Single-Arm Pallof Press.gif')

subprocess.run("cp /tmp/test_pallof_sa_split.gif 'images/gifs/Single-Arm Split Stance Pallof Press.gif'", shell=True)
convert_gif_to_webp('images/gifs/Single-Arm Split Stance Pallof Press.gif')

subprocess.run("cp /tmp/test_pallof_sa_oneleg.gif 'images/gifs/Single-Arm One Leg Pallof Press.gif'", shell=True)
convert_gif_to_webp('images/gifs/Single-Arm One Leg Pallof Press.gif')

# TRX Row GIFs
subprocess.run("cp /tmp/test_trx_wall.gif 'images/gifs/TRX Row (Feet-Elevated).gif'", shell=True)
convert_gif_to_webp('images/gifs/TRX Row (Feet-Elevated).gif')

# Weighted Chin-Up GIFs (from authentic studio-shot /tmp/orig_wchin_gif.gif)
subprocess.run("cp /tmp/orig_wchin_gif.gif 'images/gifs/Weighted Chin-Up.gif'", shell=True)
subprocess.run("cp /tmp/orig_wchin_gif.gif 'images/gifs/Weighted Chin-Up (vest 5kg).gif'", shell=True)
convert_gif_to_webp('images/gifs/Weighted Chin-Up.gif')
subprocess.run("cp 'images/gifs/Weighted Chin-Up.webp' 'images/gifs/Weighted Chin-Up (vest 5kg).webp'", shell=True)

# Foot-Supported L-Sit GIF
subprocess.run("cp /tmp/test_feet_lsit.gif 'images/gifs/Foot-Supported L-Sit.gif'", shell=True)
convert_gif_to_webp('images/gifs/Foot-Supported L-Sit.gif')

print("All authentic assets successfully built and installed!")
