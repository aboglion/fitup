import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

base64String = "DJhglgLegRaShq5dWBRLd1ODPpX97pSNBflZdcR9kZ7JOqIjc8mwVEMImRXZCusD1yvHDdKBZ2F97eC+F4kllnVcOujwcRsVOjvG5UULH0dEZ9QfNLfSwXe7pDDkoNCZtDsg8ZE1eg0CYdqCbriJEzs7bTLzyyd6SJAwnEk4pB0bhzGm3kVqtWG0vJHU/R8a2x8IBlw0oeaKkQfWIS0="
password = b"aboglion"

buf = base64.b64decode(base64String)
salt = buf[:16]
iv = buf[16:28]
ciphertext = buf[28:]

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=100000,
)
key = kdf.derive(password)

aesgcm = AESGCM(key)
try:
    decrypted = aesgcm.decrypt(iv, ciphertext, None)
    print("SUCCESS:", decrypted.decode('utf-8'))
except Exception as e:
    print("FAIL:", str(e))
