import cv2
import numpy as np

def get_body_mask(img_path):
    img = cv2.imread(img_path)
    # The background is dark. The body is skin-colored.
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)
    return mask

def print_ascii_map(img_path):
    mask = get_body_mask(img_path)
    small = cv2.resize(mask, (50, 50))
    for y in range(50):
        row = ""
        for x in range(50):
            if small[y, x] > 128:
                row += "#"
            else:
                row += "."
        # print y percentage
        print(f"{y*2:02d}% {row}")

print("FRONT:")
print_ascii_map("images/anatomy-front.webp")
print("BACK:")
print_ascii_map("images/anatomy-back.webp")
