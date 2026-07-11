import os
import shutil
import glob

src_dir = "/home/uns/.gemini/antigravity/brain/92452ef1-39e6-4260-b4b5-cdfc82fbcef9"
dest_dir = "/home/uns/fitup/images/exercises"

for file_path in glob.glob(os.path.join(src_dir, "*.png")):
    filename = os.path.basename(file_path)
    parts = filename.split("_")
    
    base_parts = []
    for p in parts:
        if p.endswith(".png") and p[:-4].isdigit():
            break
        base_parts.append(p)
    
    base_name = "_".join(base_parts)
    target_name = base_name.replace("_", " ").upper()
    
    target_name = target_name.replace("CHIN UP", "CHIN-UP")
    target_name = target_name.replace("PULL UP", "PULL-UP")
    target_name = target_name.replace("PUSH UP", "PUSH-UP")
    target_name = target_name.replace("PULL APART", "PULL-APART")
    target_name = target_name.replace("SINGLE LEG", "SINGLE-LEG")
    target_name = target_name.replace("CLOSE GRIP", "CLOSE-GRIP")
    target_name = target_name.replace("HOLLOW TO ARCH", "HOLLOW-TO-ARCH")
    
    dest_path = os.path.join(dest_dir, target_name + ".png")
    shutil.copy(file_path, dest_path)
    print(f"Copied {filename} to {target_name}.png")
