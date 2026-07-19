const crypto = require('crypto');

const base64String = "DJhglgLegRaShq5dWBRLd1ODPpX97pSNBflZdcR9kZ7JOqIjc8mwVEMImRXZCusD1yvHDdKBZ2F97eC+F4kllnVcOujwcRsVOjvG5UULH0dEZ9QfNLfSwXe7pDDkoNCZtDsg8ZE1eg0CYdqCbriJEzs7bTLzyyd6SJAwnEk4pB0bhzGm3kVqtWG0vJHU/R8a2x8IBlw0oeaKkQfWIS0=";
const password = "aboglion";

const buf = Buffer.from(base64String, 'base64');
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

const salt = buf.slice(0, SALT_LENGTH);
const iv = buf.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
const ciphertext = buf.slice(SALT_LENGTH + IV_LENGTH, buf.length - 16);
const authTag = buf.slice(buf.length - 16);

crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
    if (err) throw err;
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', iv, derivedKey);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, null, 'utf8');
        decrypted += decipher.final('utf8');
        console.log("SUCCESS:", decrypted);
    } catch(e) {
        console.log("FAIL:", e.message);
    }
});
