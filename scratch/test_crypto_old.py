import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

base64String1 = "Ur63UuaagokX3xbYezI+vgl8aD+mMxgBYog/PcKfB+Ur53Wsdg8+RrLxZGAs2t3ry8/3+nEUD9ce0D8XedMW6W2motNhood82Urgj5NrElEsuGz7CIPZ1xDdxA1g0xZ7JmKPaNi31OratoZy+a3vLPIX+I1ETKdaD7btusFmfBub5w2EfT6kkU/MD7LLKPcRerMk7lFqoKo7Jo0c9aw="
base64String2 = "/i5pdVKKHz7vyHPwbiskh4HcRyGJ59hvlHuaFfthUnPmiHrmJAsRdlE8B4csd3Z1EhYCVAaTk99/tUfPBQQnOhcRZO+6ziUJBKd53UyLpoKodAcBTcOvoD75HwM6cj2LpR/bkx1xQnCj4le3pxMd8wZNOVkfe9/6JswZ9h75cbtixe/1j6suD3/BSdcfnj+uO6Q9fa9G4CgjYMKHbRU="
base64String3 = "FqjFRutlfeiobnqbp5BeKw8M1+BZhP7WicyMnDFV7aFINezAfl6rI0ghTVfHrENGPCk2t/1UC2zIaO5wltzvjXNQpWnxoxjX4SE6ctFT1rVuQwgBe0Q5YknbfcsxUNUUSrBuGz3PvpRnDxSuSu61h5kzU9LM8yjsX/VA5lgHH3VyO9p/Jp9GAc2wyqGX46g3FvxUEenq3iqeLsrQ"

password = b"aboglion"

for s in [base64String1, base64String2, base64String3]:
    try:
        buf = base64.b64decode(s)
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
        decrypted = aesgcm.decrypt(iv, ciphertext, None)
        print("SUCCESS:", decrypted.decode('utf-8')[:30], "...")
    except Exception as e:
        print("FAIL:", str(e))
