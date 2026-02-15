/**
 * End-to-End Encryption utilities using Web Crypto API
 * Algorithm: AES-256-GCM with PBKDF2 key derivation
 */

const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_LENGTH = 256;

/**
 * Generate a random encryption salt (hex-encoded)
 */
export function generateSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive an AES-256-GCM CryptoKey from a password + salt
 */
export async function deriveKey(password, saltHex) {
    const encoder = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));

    // Import password as raw key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Derive AES-GCM key
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a file buffer.
 * Returns ArrayBuffer: [12-byte IV][ciphertext + GCM tag]
 */
export async function encryptFile(key, fileBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        fileBuffer
    );

    // Prepend IV to ciphertext
    const result = new Uint8Array(IV_BYTES + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), IV_BYTES);

    return result.buffer;
}

/**
 * Decrypt a file buffer.
 * Input: ArrayBuffer with [12-byte IV][ciphertext + GCM tag]
 * Returns: ArrayBuffer of plaintext
 */
export async function decryptFile(key, encryptedBuffer) {
    const data = new Uint8Array(encryptedBuffer);
    const iv = data.slice(0, IV_BYTES);
    const ciphertext = data.slice(IV_BYTES);

    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
}
