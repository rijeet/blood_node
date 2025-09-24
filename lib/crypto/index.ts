// Core cryptography utilities for Blood Node E2E encryption

/**
 * Generate a random 16-character user code
 */
export function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const values = crypto.getRandomValues(new Uint8Array(16));
  
  for (let i = 0; i < 16; i++) {
    result += chars[values[i] % chars.length];
  }
  
  return result;
}

/**
 * Convert base64 to hex for SSS compatibility
 */
export function base64ToHex(base64: string): string {
  const binary = atob(base64);
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i);
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex to base64
 */
export function hexToBase64(hex: string): string {
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return btoa(binary);
}

/**
 * PBKDF2 key derivation (fallback when Argon2 not available)
 */
export async function deriveKeyPBKDF2(password: string, saltBase64: string): Promise<CryptoKey> {
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 400000, // High iteration count for security
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * AES-GCM encryption
 */
export async function aesGcmEncrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string; tag: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc
  );
  
  // Split the result (last 16 bytes are the tag)
  const ciphertextArray = new Uint8Array(encrypted);
  const ciphertext = ciphertextArray.slice(0, -16);
  const tag = ciphertextArray.slice(-16);
  
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
    tag: btoa(String.fromCharCode(...tag))
  };
}

/**
 * AES-GCM decryption
 */
export async function aesGcmDecrypt(
  encryptedData: { iv: string; ciphertext: string; tag: string },
  key: CryptoKey
): Promise<string> {
  const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(encryptedData.tag), c => c.charCodeAt(0));
  
  // Combine ciphertext and tag
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    combined
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Generate ECDH keypair
 */
export async function generateECDHKeyPair(): Promise<{
  keyPair: CryptoKeyPair;
  publicKeyJWK: JsonWebKey;
  privateKeyJWK: JsonWebKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey']
  );
  
  const publicKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJWK = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  
  return {
    keyPair,
    publicKeyJWK,
    privateKeyJWK
  };
}

/**
 * Import JWK key
 */
export async function importECDHKey(
  jwk: JsonWebKey,
  isPrivate: boolean
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    false,
    isPrivate ? ['deriveKey'] : []
  );
}

/**
 * Derive shared key using ECDH
 */
export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate random salt
 */
export function generateSalt(length: number = 16): string {
  const salt = crypto.getRandomValues(new Uint8Array(length));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Generate Data Encryption Key (DEK)
 */
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export DEK as raw bytes
 */
export async function exportDEK(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

/**
 * Import DEK from raw bytes
 */
export async function importDEK(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}
