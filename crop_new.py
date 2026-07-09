import os
from PIL import Image

def main():
    pics_dir = "/home/uns/fitup/PICS"
    dest_dir = "/home/uns/fitup/images/exercises"
    
    # We will process these specific files if they exist in PICS
    files_to_process = [
        "SUPERMAN HOLD.png",
        "REVERSE LUNGES איטיים.png"
    ]
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        
    for filename in files_to_process:
        src_path = os.path.join(pics_dir, filename)
        dest_path = os.path.join(dest_dir, filename)
        
        if not os.path.exists(src_path):
            print(f"Waiting for file: {filename} in PICS folder...")
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
                print(f"Successfully processed and saved: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nFinished checking files.")

if __name__ == "__main__":
    main()
