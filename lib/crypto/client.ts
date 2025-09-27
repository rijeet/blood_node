// Client-side crypto utilities for Blood Node

import { 
  generateECDHKeyPair,
  importECDHKey,
  deriveSharedKey,
  aesGcmEncrypt,
  aesGcmDecrypt,
  generateDEK,
  exportDEK,
  importDEK,
  deriveKeyPBKDF2,
  generateSalt,
  generateUserCode
} from './index';
import { splitSecret, combineShares } from './sss';

/**
 * Client-side email hashing function
 * Must match server-side implementation exactly
 */
export function hashEmailClient(email: string): string {
  // Use the same secret as server-side (this should be consistent)
  const secret = 'bloodnode-email-hash-secret-2024'; // This should match the server's secret
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(email.toLowerCase());
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signature => {
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

/**
 * Synchronous version using Web Crypto API
 */
export async function hashEmailClientAsync(email: string): Promise<string> {
  const secret = 'bloodnode-email-hash-secret-2024';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(email.toLowerCase());
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Client-side key management
 */
export class BloodNodeCrypto {
  private userKeyPair: CryptoKeyPair | null = null;
  private kek: CryptoKey | null = null; // Key Encryption Key
  
  /**
   * Initialize user crypto during signup
   */
  async initializeNewUser(password: string): Promise<{
    userCode: string;
    publicKey: string;
    encryptedPrivateKey: string;
    masterSalt: string;
    sssShares: string[];
  }> {
    // Generate master salt
    const masterSalt = generateSalt();
    
    // Derive KEK from password
    this.kek = await deriveKeyPBKDF2(password, masterSalt);
    
    // Generate user keypair
    const { keyPair, publicKeyJWK, privateKeyJWK } = await generateECDHKeyPair();
    this.userKeyPair = keyPair;
    
    // Encrypt private key with KEK
    const privateKeyString = JSON.stringify(privateKeyJWK);
    const encryptedPrivateKeyData = await aesGcmEncrypt(privateKeyString, this.kek);
    const encryptedPrivateKey = JSON.stringify(encryptedPrivateKeyData);
    
    // Split encrypted private key using SSS
    const sssShares = await splitSecret(encryptedPrivateKey, 3, 2);
    
    // Generate user code
    const userCode = generateUserCode();
    
    return {
      userCode,
      publicKey: JSON.stringify(publicKeyJWK),
      encryptedPrivateKey,
      masterSalt,
      sssShares
    };
  }
  
  /**
   * Load user keys during login
   */
  async loadUserKeys(
    password: string,
    masterSalt: string,
    encryptedPrivateKey: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Derive KEK from password
      this.kek = await deriveKeyPBKDF2(password, masterSalt);
      
      // Decrypt private key
      const encryptedData = JSON.parse(encryptedPrivateKey);
      const privateKeyString = await aesGcmDecrypt(encryptedData, this.kek);
      const privateKeyJWK = JSON.parse(privateKeyString);
      const publicKeyJWK = JSON.parse(publicKey);
      
      // Import keys
      const privateKey = await importECDHKey(privateKeyJWK, true);
      const publicKeyObj = await importECDHKey(publicKeyJWK, false);
      
      this.userKeyPair = { privateKey, publicKey: publicKeyObj };
      
      return true;
    } catch (error) {
      console.error('Failed to load user keys:', error);
      return false;
    }
  }
  
  /**
   * Recover user keys from SSS shares
   */
  async recoverFromShares(
    shares: string[],
    password: string,
    masterSalt: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Combine SSS shares to get encrypted private key
      const encryptedPrivateKey = await combineShares(shares);
      
      // Load keys normally
      return this.loadUserKeys(password, masterSalt, encryptedPrivateKey, publicKey);
    } catch (error) {
      console.error('Failed to recover from shares:', error);
      return false;
    }
  }
  
  /**
   * Encrypt data for a relative
   */
  async encryptRelativeData(data: any, recipients: string[]): Promise<{
    encryptedBlob: any;
    dekWrapped: Array<{ recipient_user_code: string; wrapped: string; meta: any }>;
  }> {
    if (!this.userKeyPair) {
      throw new Error('User keys not loaded');
    }
    
    // Generate DEK for this record
    const dek = await generateDEK();
    
    // Encrypt data with DEK
    const dataString = JSON.stringify(data);
    const encryptedBlob = await aesGcmEncrypt(dataString, dek);
    
    // Export DEK as raw bytes
    const dekBytes = await exportDEK(dek);
    
    // Wrap DEK for each recipient (including self)
    const dekWrapped = [];
    
    // Wrap for self (owner)
    const selfWrapped = await aesGcmEncrypt(
      btoa(String.fromCharCode(...new Uint8Array(dekBytes))),
      this.userKeyPair.publicKey as any // In real implementation, use KEK or derive shared key with self
    );
    
    dekWrapped.push({
      recipient_user_code: 'self', // Replace with actual user code
      wrapped: JSON.stringify(selfWrapped),
      meta: {}
    });
    
    // Wrap for other recipients
    for (const recipientUserCode of recipients) {
      // TODO: Get recipient's public key
      // For now, we'll create a placeholder
      const recipientWrapped = await aesGcmEncrypt(
        btoa(String.fromCharCode(...new Uint8Array(dekBytes))),
        this.userKeyPair.publicKey as any // Use recipient's public key
      );
      
      dekWrapped.push({
        recipient_user_code: recipientUserCode,
        wrapped: JSON.stringify(recipientWrapped),
        meta: {}
      });
    }
    
    return {
      encryptedBlob,
      dekWrapped
    };
  }
  
  /**
   * Decrypt relative data
   */
  async decryptRelativeData(
    encryptedBlob: any,
    dekWrapped: Array<{ recipient_user_code: string; wrapped: string; meta: any }>,
    userCode: string
  ): Promise<any> {
    if (!this.userKeyPair) {
      throw new Error('User keys not loaded');
    }
    
    // Find our DEK wrapped entry
    const ourDekEntry = dekWrapped.find(entry => 
      entry.recipient_user_code === userCode || entry.recipient_user_code === 'self'
    );
    
    if (!ourDekEntry) {
      throw new Error('No access to this data');
    }
    
    // Unwrap DEK
    const wrappedDekData = JSON.parse(ourDekEntry.wrapped);
    const dekBase64 = await aesGcmDecrypt(wrappedDekData, this.userKeyPair.privateKey as any);
    const dekBytes = Uint8Array.from(atob(dekBase64), c => c.charCodeAt(0));
    
    // Import DEK
    const dek = await importDEK(dekBytes.buffer);
    
    // Decrypt data
    const decryptedString = await aesGcmDecrypt(encryptedBlob, dek);
    return JSON.parse(decryptedString);
  }
  
  /**
   * Wrap DEK for new recipient (for sharing)
   */
  async wrapDEKForRecipient(
    encryptedBlob: any,
    currentDekWrapped: Array<{ recipient_user_code: string; wrapped: string; meta: any }>,
    recipientPublicKey: string,
    recipientUserCode: string,
    userCode: string
  ): Promise<{ recipient_user_code: string; wrapped: string; meta: any }> {
    if (!this.userKeyPair) {
      throw new Error('User keys not loaded');
    }
    
    // First, unwrap our own DEK
    const ourDekEntry = currentDekWrapped.find(entry => 
      entry.recipient_user_code === userCode || entry.recipient_user_code === 'self'
    );
    
    if (!ourDekEntry) {
      throw new Error('No access to this data');
    }
    
    // Unwrap our DEK
    const wrappedDekData = JSON.parse(ourDekEntry.wrapped);
    const dekBase64 = await aesGcmDecrypt(wrappedDekData, this.userKeyPair.privateKey as any);
    const dekBytes = Uint8Array.from(atob(dekBase64), c => c.charCodeAt(0));
    
    // Import recipient's public key
    const recipientPubKey = await importECDHKey(JSON.parse(recipientPublicKey), false);
    
    // Derive shared key with recipient
    const sharedKey = await deriveSharedKey(this.userKeyPair.privateKey, recipientPubKey);
    
    // Wrap DEK with shared key
    const wrappedForRecipient = await aesGcmEncrypt(
      btoa(String.fromCharCode(...dekBytes)),
      sharedKey
    );
    
    return {
      recipient_user_code: recipientUserCode,
      wrapped: JSON.stringify(wrappedForRecipient),
      meta: {}
    };
  }
  
  /**
   * Get public key as string
   */
  getPublicKey(): string | null {
    if (!this.userKeyPair) return null;
    // This would need to export the key, but for now return placeholder
    return 'public_key_placeholder';
  }
  
  /**
   * Clear keys from memory
   */
  clearKeys(): void {
    this.userKeyPair = null;
    this.kek = null;
  }
}
