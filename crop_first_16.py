import os
from PIL import Image

def main():
    pics_dir = "/home/uns/fitup/first_16_prompts"
    dest_dir = "/home/uns/fitup/images/exercises"
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        
    for filename in os.listdir(pics_dir):
        if not filename.endswith(".png"):
            continue
            
        src_path = os.path.join(pics_dir, filename)
        dest_path = os.path.join(dest_dir, filename)
        
        try:
            with Image.open(src_path) as img:
                # Calculate the top 18% to crop out the text title
                width, height = img.size
                crop_top = int(height * 0.18)
                
                # Crop the image: (left, upper, right, lower)
                cropped_img = img.crop((0, crop_top, width, height))
                
                # Save the cropped image to the destination, overwriting the old one
                cropped_img.save(dest_path)
                print(f"Successfully processed and replaced: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nFinished cropping images from first_16_prompts and replacing them in images/exercises/")

if __name__ == "__main__":
    main()
