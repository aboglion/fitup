import base64
import os
import re
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_url(url, password):
    salt = os.urandom(16)
    iv = os.urandom(12)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode('utf-8'))
    
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, url.encode('utf-8'), None)
    
    buf = salt + iv + ciphertext
    return base64.b64encode(buf).decode('utf-8')

if __name__ == "__main__":
    print("=== יצירת קישור מוצפן חדש לאפליקציה ===")
    print("נראה שהקישור ב-config.js ישן וכבר לא עובד (שגיאה 403), ולכן אתה מקבל שגיאה גם כשהסיסמה נכונה.")
    new_url = input("הדבק כאן את כתובת ה-Web App החדשה שקיבלת מגוגל דרייב (מתחילה ב-https://script.google.com/): ").strip()
    
    if new_url:
        password = "aboglion"
        encrypted = encrypt_url(new_url, password)
        print("\nהקישור הוצפן בהצלחה!\n")
        
        config_path = "js/config.js"
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            new_content = re.sub(r'encryptedUrl:\s*".*?"', f'encryptedUrl: "{encrypted}"', content)
            
            with open(config_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            print("הקובץ js/config.js עודכן בהצלחה! תעלה את השינויים לגיטהאב והבעיה תיפתר.")
        else:
            print("לא מצאתי את הקובץ js/config.js. הנה המחרוזת שאתה צריך להעתיק לקובץ:")
            print(f'encryptedUrl: "{encrypted}"')
