import shutil
import os

src_rdl = "/home/uns/.gemini/antigravity/brain/3c4240e3-d7ab-40d3-b3c5-6511f81e3faa/banded_single_leg_rdl_fixed_1783790166624.png"
dst_rdl = "/home/uns/fitup/images/exercises/BANDED SINGLE-LEG RDL.png"

src_glute = "/home/uns/.gemini/antigravity/brain/3c4240e3-d7ab-40d3-b3c5-6511f81e3faa/banded_glute_bridge_fixed_1783790175306.png"
dst_glute = "/home/uns/fitup/images/exercises/BANDED GLUTE BRIDGE.png"

try:
    if os.path.exists(src_rdl):
        shutil.copy(src_rdl, dst_rdl)
        print("✅ Copied Banded Single-Leg RDL image successfully!")
    else:
        print(f"❌ Source image not found: {src_rdl}")

    if os.path.exists(src_glute):
        shutil.copy(src_glute, dst_glute)
        print("✅ Copied Banded Glute Bridge image successfully!")
    else:
        print(f"❌ Source image not found: {src_glute}")
        
except Exception as e:
    print(f"Error copying files: {e}")
