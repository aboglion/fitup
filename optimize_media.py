#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess
from pathlib import Path

# Try to import Pillow. If not present, print a nice warning.
try:
    from PIL import Image, ImageSequence
except ImportError:
    print("*" * 60)
    print("Pillow library is required for Python fallback optimization.")
    print("Please install it by running:")
    print("    pip install Pillow")
    print("*" * 60)
    Image = None

# Configuration
PNG_MAX_SIZE = (800, 800)  # Max resolution for exercise static images
GIF_MAX_SIZE = (400, 400)  # Max resolution for animated GIFs
GIF_COLORS = 64            # Limit colors in GIF to save space

def check_command_exists(cmd):
    return shutil.which(cmd) is not None

def get_file_size_mb(path):
    return path.stat().st_size / (1024 * 1024)

def optimize_png_pillow(input_path, max_size=PNG_MAX_SIZE):
    if Image is None:
        return False
    try:
        with Image.open(input_path) as img:
            orig_format = img.format
            # Resize if dimensions exceed max size
            if img.width > max_size[0] or img.height > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized
            img.save(input_path, format=orig_format, optimize=True)
            return True
    except Exception as e:
        print(f"  [Pillow PNG Error] {input_path.name}: {e}")
        return False

def optimize_png_optipng(input_path):
    try:
        # Run optipng with moderate optimization
        subprocess.run(["optipng", "-o2", "-strip", "all", str(input_path)], 
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except Exception as e:
        return False

def optimize_gif_pillow(input_path, max_size=GIF_MAX_SIZE, colors=GIF_COLORS):
    if Image is None:
        return False
    try:
        with Image.open(input_path) as im:
            is_animated = getattr(im, "is_animated", False)
            
            frames = []
            durations = []
            loops = im.info.get('loop', 0)
            
            for frame in ImageSequence.Iterator(im):
                # Copy frame & convert to RGBA to resize cleanly
                rgba_frame = frame.convert("RGBA")
                
                # Resize if needed
                if rgba_frame.width > max_size[0] or rgba_frame.height > max_size[1]:
                    rgba_frame.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                transparency = frame.info.get('transparency')
                if transparency is not None:
                    # Handle transparency by creating a palette mode image with transparency mapped
                    alpha = rgba_frame.getchannel('A')
                    # Convert RGB part to P
                    p_frame = rgba_frame.convert("RGB").convert("P", palette=Image.Palette.ADAPTIVE, colors=colors - 1)
                    # Create a mask where alpha is transparent (<= 128)
                    mask = Image.eval(alpha, lambda a: 255 if a <= 128 else 0)
                    # Paste the transparent color index (colors-1) into masked areas
                    p_frame.paste(colors - 1, mask)
                    p_frame.info['transparency'] = colors - 1
                else:
                    p_frame = rgba_frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=colors)
                
                frames.append(p_frame)
                durations.append(frame.info.get('duration', 100))
            
            if is_animated and len(frames) > 1:
                frames[0].save(
                    input_path,
                    save_all=True,
                    append_images=frames[1:],
                    optimize=True,
                    duration=durations,
                    loop=loops
                )
            else:
                frames[0].save(input_path, optimize=True)
            return True
    except Exception as e:
        print(f"  [Pillow GIF Error] {input_path.name}: {e}")
        return False

def optimize_gif_gifsicle(input_path, max_size=GIF_MAX_SIZE, colors=GIF_COLORS):
    try:
        # Check current GIF dimensions
        # Use simple commands or let gifsicle handle scaling in one go
        # Gifsicle args:
        # --resize-fit WxH downscales to fit inside dimensions without stretching
        # -O3 performs high level optimization
        # --colors 64 reduces the color palette
        temp_path = input_path.with_suffix('.tmp.gif')
        cmd = [
            "gifsicle",
            "-O3",
            f"--colors={colors}",
            "--resize-fit", f"{max_size[0]}x{max_size[1]}",
            str(input_path),
            "-o", str(temp_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if temp_path.exists():
            # Check if optimized size is actually smaller
            if temp_path.stat().st_size < input_path.stat().st_size:
                shutil.move(str(temp_path), str(input_path))
            else:
                temp_path.unlink()
            return True
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        return False

def main():
    print("=" * 60)
    print("               FITUP MEDIA OPTIMIZATION SCRIPT")
    print("=" * 60)

    # Check directories
    exercises_dir = Path("images/exercises")
    gifs_dir = Path("images/gifs")

    if not exercises_dir.exists() or not gifs_dir.exists():
        print("Error: Running from wrong directory. Please run this script from the project root directory containing 'images/'.")
        sys.exit(1)

    # CLI Tool Status
    gifsicle_found = check_command_exists("gifsicle")
    optipng_found = check_command_exists("optipng")
    print("External tools status:")
    print(f"  gifsicle: {'Available (Preferred for GIFs)' if gifsicle_found else 'NOT Available (Will use Pillow)'}")
    print(f"  optipng:  {'Available (Preferred for PNGs)' if optipng_found else 'NOT Available (Will use Pillow)'}")
    print("-" * 60)

    if Image is None and (not gifsicle_found or not optipng_found):
        print("Error: Pillow is not installed and some external tools are missing. Please run 'pip install Pillow' first.")
        sys.exit(1)

    # Store stats
    stats = {
        'png': {'original': 0, 'optimized': 0, 'count': 0, 'errors': 0},
        'gif': {'original': 0, 'optimized': 0, 'count': 0, 'errors': 0}
    }

    # 1. Optimize PNG images
    png_files = list(exercises_dir.glob("*.png")) + list(exercises_dir.glob("*.PNG"))
    print(f"Optimizing {len(png_files)} PNG files in '{exercises_dir}'...")
    for idx, png_path in enumerate(png_files, 1):
        orig_size = get_file_size_mb(png_path)
        stats['png']['original'] += orig_size
        stats['png']['count'] += 1
        
        print(f"[{idx}/{len(png_files)}] {png_path.name} ({orig_size:.2f} MB)", end="", flush=True)
        
        success = False
        # Try optipng if available, but always resize with pillow first to save massive amounts of pixels
        # A 4.5MB 3000x3000px PNG will still be huge in optipng unless resized.
        # So we resize with Pillow, then run optipng on it.
        resized = False
        if Image is not None:
            resized = optimize_png_pillow(png_path)
            success = resized
            
        if optipng_found:
            # Run optipng for final lossless compression squeeze
            opt_success = optimize_png_optipng(png_path)
            success = success or opt_success
            
        if success:
            opt_size = get_file_size_mb(png_path)
            stats['png']['optimized'] += opt_size
            reduction = ((orig_size - opt_size) / orig_size) * 100 if orig_size > 0 else 0
            print(f" -> Optimized: {opt_size:.2f} MB (-{reduction:.1f}%)")
        else:
            stats['png']['optimized'] += orig_size
            stats['png']['errors'] += 1
            print(" -> FAILED")

    print("-" * 60)

    # 2. Optimize GIF files
    gif_files = list(gifs_dir.glob("*.gif")) + list(gifs_dir.glob("*.GIF"))
    print(f"Optimizing {len(gif_files)} GIF files in '{gifs_dir}'...")
    for idx, gif_path in enumerate(gif_files, 1):
        orig_size = get_file_size_mb(gif_path)
        stats['gif']['original'] += orig_size
        stats['gif']['count'] += 1
        
        print(f"[{idx}/{len(gif_files)}] {gif_path.name} ({orig_size:.2f} MB)", end="", flush=True)
        
        success = False
        # Try gifsicle first
        if gifsicle_found:
            success = optimize_gif_gifsicle(gif_path)
            
        # Fallback to Pillow
        if not success and Image is not None:
            success = optimize_gif_pillow(gif_path)
            
        if success:
            opt_size = get_file_size_mb(gif_path)
            stats['gif']['optimized'] += opt_size
            reduction = ((orig_size - opt_size) / orig_size) * 100 if orig_size > 0 else 0
            print(f" -> Optimized: {opt_size:.2f} MB (-{reduction:.1f}%)")
        else:
            stats['gif']['optimized'] += orig_size
            stats['gif']['errors'] += 1
            print(" -> FAILED")

    # Summary Report
    print("=" * 60)
    print("                        SUMMARY REPORT")
    print("=" * 60)
    
    total_orig = stats['png']['original'] + stats['gif']['original']
    total_opt = stats['png']['optimized'] + stats['gif']['optimized']
    total_saved = total_orig - total_opt
    total_pct = (total_saved / total_orig) * 100 if total_orig > 0 else 0
    
    print(f"PNG Files: {stats['png']['count']} files processed ({stats['png']['errors']} errors)")
    print(f"  Original Size:  {stats['png']['original']:.2f} MB")
    print(f"  Optimized Size: {stats['png']['optimized']:.2f} MB")
    print(f"  Saved Size:     {stats['png']['original'] - stats['png']['optimized']:.2f} MB")
    print()
    print(f"GIF Files: {stats['gif']['count']} files processed ({stats['gif']['errors']} errors)")
    print(f"  Original Size:  {stats['gif']['original']:.2f} MB")
    print(f"  Optimized Size: {stats['gif']['optimized']:.2f} MB")
    print(f"  Saved Size:     {stats['gif']['original'] - stats['gif']['optimized']:.2f} MB")
    print("-" * 60)
    print(f"TOTAL ORIGINAL SIZE:  {total_orig:.2f} MB")
    print(f"TOTAL OPTIMIZED SIZE: {total_opt:.2f} MB")
    print(f"TOTAL SPACE SAVED:    {total_saved:.2f} MB (-{total_pct:.1f}%)")
    print("=" * 60)
    print("Done! Check your application performance now.")
    print("=" * 60)

if __name__ == "__main__":
    main()
