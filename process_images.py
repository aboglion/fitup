import os
from PIL import Image
import subprocess
import sys

# Ensure Pillow is installed
try:
    import PIL
except ImportError:
    print("Pillow not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def main():
    pics_dir = "/home/uns/fitup/PICS"
    dest_dir = "/home/uns/fitup/images/exercises"
    
    # Mapping of generated file names to their corresponding exercise names
    mapping = {
        "Gemini_Generated_Image_och14hoch14hoch1.png": "BAND WOODCHOP.png",
        "Gemini_Generated_Image_och14hoch14hoch1(1).png": "BENCH DIP.png",
        "Gemini_Generated_Image_och14hoch14hoch1(2).png": "BENCH DIP (רגל אחת מורומה).png",
        "Gemini_Generated_Image_och14hoch14hoch1(3).png": "BENCH DIP (רגליים מורמות על כיסא).png",
        "Gemini_Generated_Image_och14hoch14hoch1(4).png": "BAND-ASSISTED PULL-UP.png",
        "Gemini_Generated_Image_och14hoch14hoch1(5).png": "COUCH STRETCH.png",
        "Gemini_Generated_Image_och14hoch14hoch1(6).png": "FLOOR HAMSTRING CURL.png",
        "Gemini_Generated_Image_och14hoch14hoch1(7).png": "HOLLOW BODY ROCK.png",
        "Gemini_Generated_Image_och14hoch14hoch1(8).png": "LATERAL LUNGES.png",
        "Gemini_Generated_Image_och14hoch14hoch1(9).png": "SCAPULAR PULL-UP.png",
        "Gemini_Generated_Image_och14hoch14hoch1(10).png": "SIDE PLANK.png",
        "Gemini_Generated_Image_och14hoch14hoch1(11).png": "SIDE-LYING EXTERNAL ROTATION.png",
        "Gemini_Generated_Image_och14hoch14hoch1(12).png": "SINGLE-LEG RDL.png",
        "Gemini_Generated_Image_och14hoch14hoch1(13).png": "STEP-UPS.png",
        "Gemini_Generated_Image_och14hoch14hoch1(14).png": "SUPERMAN.png",
        "Gemini_Generated_Image_och14hoch14hoch1(15).png": "TOE YOGA.png",
        "Gemini_Generated_Image_och14hoch14hoch1(16).png": "TOWEL GRIP HANG.png",
        "Gemini_Generated_Image_och14hoch14hoch1(17).png": "BAND PULL-APART.png",
        "Gemini_Generated_Image_ywiw1nywiw1nywiw.png": "KNEE FINGER PUSH-UP.png",
    }
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        
    for src_filename, dest_filename in mapping.items():
        src_path = os.path.join(pics_dir, src_filename)
        dest_path = os.path.join(dest_dir, dest_filename)
        
        if not os.path.exists(src_path):
            print(f"Warning: Missing source file {src_filename}")
            continue
            
        try:
            with Image.open(src_path) as img:
                # Calculate the top 18% to crop out the text title
                width, height = img.size
                crop_top = int(height * 0.18)
                
                # Crop the image: (left, upper, right, lower)
                cropped_img = img.crop((0, crop_top, width, height))
                
                # Save the cropped image to the destination
                cropped_img.save(dest_path)
                print(f"Successfully processed and saved: {dest_filename}")
        except Exception as e:
            print(f"Error processing {src_filename}: {e}")

    print("\nAll images have been processed, cropped, and moved to images/exercises/")

if __name__ == "__main__":
    main()
