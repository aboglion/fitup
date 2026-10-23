import os, sys, subprocess
from PIL import Image

os.makedirs('images/exercises', exist_ok=True)
os.makedirs('images/gifs', exist_ok=True)
os.makedirs('/tmp/build_assets', exist_ok=True)

def make_pingpong_gif(frame_paths, out_gif_path, duration_ms=90, reverse=True):
    """Creates a smooth looping GIF from a list of frames, optionally with ping-pong."""
    frames = [Image.open(p).convert('RGBA') for p in frame_paths]
    if reverse and len(frames) > 2:
        all_frames = frames + frames[-2:0:-1]
    else:
        all_frames = frames
    
    # Save GIF
    first = all_frames[0].convert('P', palette=Image.Palette.ADAPTIVE)
    rest = [f.convert('P', palette=Image.Palette.ADAPTIVE) for f in all_frames[1:]]
    first.save(out_gif_path, save_all=True, append_images=rest, duration=duration_ms, loop=0, optimize=True)
    print(f"[OK GIF] {out_gif_path} ({len(all_frames)} frames)")
    
    # Also save as WebP animation
    out_webp_path = out_gif_path.replace('.gif', '.webp')
    cmd = f"ffmpeg -y -i '{out_gif_path}' -vcodec libwebp -lossless 0 -q:v 85 -loop 0 '{out_webp_path}' 2>/dev/null"
    subprocess.run(cmd, shell=True)
    print(f"[OK WebP Animation] {out_webp_path}")

def save_static_pair(img, base_name):
    """Saves PNG and WebP for an exercise."""
    png_path = f"images/exercises/{base_name}.png"
    webp_path = f"images/exercises/{base_name}.webp"
    img.save(png_path, "PNG", optimize=True)
    img.save(webp_path, "WEBP", quality=92)
    print(f"[OK Static] {png_path} & {webp_path}")

print("=== 1. NORDIC CURL (ECCENTRIC ONLY) ===")
# Extract descent frames: 0.1s to 2.6s (before catching floor)
ecc_dir = '/tmp/build_assets/nordic_ecc'
os.makedirs(ecc_dir, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-ss', '00:00:00.1', '-to', '00:00:02.6',
    '-i', '/tmp/nordic_ecc_2.mp4.webm',
    '-vf', 'fps=10,crop=380:320:90:40,scale=400:336',
    f'{ecc_dir}/f_%03d.png'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

ecc_frames = sorted([os.path.join(ecc_dir, f) for f in os.listdir(ecc_dir) if f.endswith('.png')])
make_pingpong_gif(ecc_frames, 'images/gifs/Nordic Curl (Eccentric Only).gif', duration_ms=100, reverse=True)

# Static image: Frame showing 45-degree controlled descent with hands back
ecc_static_idx = min(len(ecc_frames) - 3, 18)
ecc_static_img = Image.open(ecc_frames[ecc_static_idx]).convert('RGBA')
save_static_pair(ecc_static_img, "NORDIC CURL (ECCENTRIC ONLY)")


print("=== 2. FULL NORDIC CURL ===")
# Extract full curl down and up (no hands)
full_dir = '/tmp/build_assets/nordic_full'
os.makedirs(full_dir, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-ss', '00:00:50.5', '-to', '00:00:53.8',
    '-i', '/tmp/nordic_no_hands.mp4',
    '-vf', 'fps=10,crop=380:320:70:40,scale=400:336',
    f'{full_dir}/f_%03d.png'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

full_frames = sorted([os.path.join(full_dir, f) for f in os.listdir(full_dir) if f.endswith('.png')])
make_pingpong_gif(full_frames, 'images/gifs/Full Nordic Curl.gif', duration_ms=90, reverse=False)

# Static image: Frame in mid-curl horizontal hold without hands
full_static_idx = len(full_frames) // 2
full_static_img = Image.open(full_frames[full_static_idx]).convert('RGBA')
save_static_pair(full_static_img, "FULL NORDIC CURL")


print("=== 3. WEIGHTED CHIN-UP ===")
# Extract rep from sklz vest (clean white studio, weighted vest clearly visible)
wchin_dir = '/tmp/build_assets/wchin'
os.makedirs(wchin_dir, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-ss', '00:00:22.0', '-to', '00:00:24.5',
    '-i', '/tmp/sklz_vest_dl.mp4',
    '-vf', 'fps=12,crop=220:240:100:0,scale=360:400',
    f'{wchin_dir}/f_%03d.png'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

wchin_frames = sorted([os.path.join(wchin_dir, f) for f in os.listdir(wchin_dir) if f.endswith('.png')])
make_pingpong_gif(wchin_frames, 'images/gifs/Weighted Chin-Up.gif', duration_ms=80, reverse=True)
# Also copy to 'Weighted Chin-Up (vest 5kg).gif'
import shutil
shutil.copy('images/gifs/Weighted Chin-Up.gif', 'images/gifs/Weighted Chin-Up (vest 5kg).gif')
shutil.copy('images/gifs/Weighted Chin-Up.webp', 'images/gifs/Weighted Chin-Up (vest 5kg).webp')

# Static image: Chin over the bar with weighted vest visible
wchin_static_idx = len(wchin_frames) - 1
wchin_static_img = Image.open(wchin_frames[wchin_static_idx]).convert('RGBA')
save_static_pair(wchin_static_img, "WEIGHTED CHIN-UP")


print("=== 4. FOOT-SUPPORTED L-SIT ===")
# Extract support hold on parallettes with feet resting on mat
lsit_dir = '/tmp/build_assets/lsit'
os.makedirs(lsit_dir, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-ss', '00:00:39.0', '-to', '00:00:43.0',
    '-i', '/tmp/lsit_support.mp4',
    '-vf', 'fps=10,crop=420:300:100:60,scale=400:285',
    f'{lsit_dir}/f_%03d.png'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

lsit_frames = sorted([os.path.join(lsit_dir, f) for f in os.listdir(lsit_dir) if f.endswith('.png')])
make_pingpong_gif(lsit_frames, 'images/gifs/Foot-Supported L-Sit.gif', duration_ms=90, reverse=True)

# Static image: Frame showing solid depressed shoulders hold on parallettes with feet forward
lsit_static_idx = len(lsit_frames) // 2
lsit_static_img = Image.open(lsit_frames[lsit_static_idx]).convert('RGBA')
save_static_pair(lsit_static_img, "FOOT-SUPPORTED L-SIT")


print("=== 5. TRX ROW (FEET-ELEVATED) ===")
# Extract horizontal row with feet on step bench
trx_dir = '/tmp/build_assets/trx_fe'
os.makedirs(trx_dir, exist_ok=True)
subprocess.run([
    'ffmpeg', '-y', '-ss', '00:00:05.5', '-to', '00:00:08.5',
    '-i', '/tmp/trx_elevated_row.mp4',
    '-vf', 'fps=10,crop=320:240:150:80,scale=400:300',
    f'{trx_dir}/f_%03d.png'
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

trx_frames = sorted([os.path.join(trx_dir, f) for f in os.listdir(trx_dir) if f.endswith('.png')])
make_pingpong_gif(trx_frames, 'images/gifs/TRX Row (Feet-Elevated).gif', duration_ms=90, reverse=True)

# Static image: Chest pulled to handles with feet elevated on bench
trx_static_idx = len(trx_frames) // 2
trx_static_img = Image.open(trx_frames[trx_static_idx]).convert('RGBA')
save_static_pair(trx_static_img, "TRX ROW (FEET-ELEVATED)")

print("=== ALL ASSETS GENERATED SUCCESSFULLY! ===")
