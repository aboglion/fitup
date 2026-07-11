import os
from PIL import Image

def crop_upper(img_path):
    with Image.open(img_path) as img:
        width, height = img.size
        # Crop the top half (e.g. 0 to height * 0.6)
        cropped = img.crop((0, 0, width, int(height * 0.6)))
        cropped.save(img_path)
        print(f"Cropped upper for {img_path}")

def crop_lower(img_path):
    with Image.open(img_path) as img:
        width, height = img.size
        # Crop the lower half (e.g. height * 0.4 to height)
        cropped = img.crop((0, int(height * 0.4), width, height))
        cropped.save(img_path)
        print(f"Cropped lower for {img_path}")

if __name__ == "__main__":
    base_dir = "/home/uns/fitup/images/exercises"
    crop_upper(os.path.join(base_dir, "BAND PULL-APART.png"))
    crop_lower(os.path.join(base_dir, "CALF RAISE.png"))
