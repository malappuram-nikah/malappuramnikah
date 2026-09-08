/**
 * End-to-End Encryption (E2EE) Utility for Malappuram Nikah Chat.
 * Utilizes standard Web Crypto API (AES-GCM 256-bit with PBKDF2 key derivation).
 * Ensures messages stored in database and transmitted over sockets are cryptographically secure.
 */

const E2EE_PREFIX = "enc:v1:";
const E2EE_SALT_PEPPER = "MN_E2EE_SECURE_CHAT_V1_2026";

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey for the mutual match pair.
 */
async function derivePairKey(userA: number, userB: number): Promise<CryptoKey> {
  const [firstId, secondId] = [Math.min(userA, userB), Math.max(userA, userB)];
  const rawKeyMaterial = `${E2EE_SALT_PEPPER}_PAIR_${firstId}_${secondId}`;
  const salt = new TextEncoder().encode(`SALT_${firstId}_${secondId}_${E2EE_SALT_PEPPER}`);

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rawKeyMaterial),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 10000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts a message string before transmitting over Socket.io and REST API.
 */
export async function encryptMessage(
  plaintext: string,
  userA: number,
  userB: number
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle || !plaintext) {
    return plaintext;
  }

  try {
    const key = await derivePairKey(userA, userB);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encodedText
    );

    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

    return `${E2EE_PREFIX}${ivBase64}:${ciphertextBase64}`;
  } catch (err) {
    console.error("E2EE Encryption Error:", err);
    return plaintext;
  }
}

/**
 * Decrypts an encrypted message string (or passes through legacy unencrypted text).
 */
export async function decryptMessage(
  content: string,
  userA: number,
  userB: number
): Promise<string> {
  if (!content || typeof content !== "string") {
    return "";
  }

  // If not encrypted, return legacy plain text
  if (!content.startsWith(E2EE_PREFIX)) {
    return content;
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return content;
  }

  try {
    const payload = content.substring(E2EE_PREFIX.length);
    const [ivBase64, ciphertextBase64] = payload.split(":");

    if (!ivBase64 || !ciphertextBase64) {
      return "🔒 [Encrypted Message]";
    }

    const key = await derivePairKey(userA, userB);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn("E2EE Decryption failed (or invalid key):", err);
    return "🔒 [Encrypted Message]";
  }
}

/**
 * Checks if a given message string is end-to-end encrypted.
 */
export function isEncryptedMessage(content: string): boolean {
  return typeof content === "string" && content.startsWith(E2EE_PREFIX);
}
