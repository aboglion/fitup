/**
 * Crypto Module
 * Handles encryption and decryption of strings using AES-GCM and PBKDF2.
 */
const Crypto = (() => {
  // Constants for key derivation
  const PBKDF2_ITERATIONS = 100000;
  const SALT_LENGTH = 16;
  const IV_LENGTH = 12;

  /**
   * Helper: Convert string to ArrayBuffer
   */
  function str2ab(str) {
    return new TextEncoder().encode(str);
  }

  /**
   * Helper: Convert ArrayBuffer to base64 string
   */
  function ab2base64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Helper: Convert base64 string to ArrayBuffer
   */
  function base642ab(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Derive an AES-GCM key from a password
   */
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypt a string using a password
   * Returns a base64 string containing: salt|iv|ciphertext
   */
  async function encrypt(text, password) {
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const key = await deriveKey(password, salt);
      
      const encodedText = str2ab(text);
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encodedText
      );

      // Combine salt + iv + ciphertext
      const encryptedContentArr = new Uint8Array(encryptedContent);
      const buf = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContentArr.byteLength);
      
      buf.set(salt, 0);
      buf.set(iv, salt.byteLength);
      buf.set(encryptedContentArr, salt.byteLength + iv.byteLength);
      
      return ab2base64(buf.buffer);
    } catch (e) {
      console.error("Encryption failed", e);
      return null;
    }
  }

  /**
   * Decrypt a base64 string using a password
   */
  async function decrypt(base64String, password) {
    try {
      const buf = new Uint8Array(base642ab(base64String));
      
      const salt = buf.slice(0, SALT_LENGTH);
      const iv = buf.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const data = buf.slice(SALT_LENGTH + IV_LENGTH);

      const key = await deriveKey(password, salt);

      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        data
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedContent);
    } catch (e) {
      // e.g. wrong password
      console.error("Decryption failed", e);
      return null;
    }
  }

  return {
    encrypt,
    decrypt
  };
})();
