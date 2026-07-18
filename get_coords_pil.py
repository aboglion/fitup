from PIL import Image

def print_ascii_map(img_path):
    img = Image.open(img_path).convert('L')
    small = img.resize((50, 50))
    pixels = small.load()
    for y in range(50):
        row = ""
        for x in range(50):
            if pixels[x, y] > 40:
                row += "#"
            else:
                row += "."
        # print y percentage and grid
        print(f"{y*2:02d}% {row}")
    # print x grid
    print("    " + "".join([str((x*2)//10) if x % 5 == 0 else " " for x in range(50)]))
    print("    " + "".join([str((x*2)%10) if x % 5 == 0 else " " for x in range(50)]))

print("FRONT:")
print_ascii_map("images/anatomy-front.webp")
print("BACK:")
print_ascii_map("images/anatomy-back.webp")
