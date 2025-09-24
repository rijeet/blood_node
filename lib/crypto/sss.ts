// Shamir Secret Sharing utilities

/**
 * Split a secret using Shamir Secret Sharing
 * Note: This is a simplified implementation. In production, use secrets.js library
 */
export interface SSS {
  split(secret: string, options: { shares: number; threshold: number }): string[];
  combine(shares: string[]): string;
}

// Mock SSS implementation for development - replace with actual sss-js in production
export const mockSSS: SSS = {
  split(secret: string, options: { shares: number; threshold: number }): string[] {
    // This is a mock implementation for development
    // In production, replace with actual sss-js library
    const shares: string[] = [];
    
    for (let i = 0; i < options.shares; i++) {
      // Create a simple encoded share (NOT CRYPTOGRAPHICALLY SECURE - for demo only)
      const shareData = {
        index: i + 1,
        secret: secret, // In real SSS, this would be a point on the polynomial
        threshold: options.threshold,
        shares: options.shares
      };
      shares.push(btoa(JSON.stringify(shareData)));
    }
    
    return shares;
  },

  combine(shares: string[]): string {
    // Mock implementation - in production use sss-js
    if (shares.length < 2) {
      throw new Error('Need at least 2 shares to reconstruct secret');
    }
    
    try {
      const shareData = JSON.parse(atob(shares[0]));
      return shareData.secret;
    } catch (error) {
      throw new Error('Invalid share format');
    }
  }
};

// Production SSS functions (to be implemented with secrets.js)
export async function splitSecret(
  secret: string,
  totalShares: number = 3,
  threshold: number = 2
): Promise<string[]> {
  // TODO: Replace with actual secrets.js implementation
  // const secrets = require('secrets.js');
  // return secrets.share(secret, totalShares, threshold);
  
  return mockSSS.split(secret, { shares: totalShares, threshold });
}

export async function combineShares(shares: string[]): Promise<string> {
  // TODO: Replace with actual secrets.js implementation
  // const secrets = require('secrets.js');
  // return secrets.combine(shares);
  
  return mockSSS.combine(shares);
}

/**
 * Create email share with human-readable verification code
 */
export function createEmailShare(share: string): {
  emailShare: string;
  verificationCode: string;
} {
  // Generate a 16-digit verification code for human verification
  const verificationCode = Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    byte => (byte % 10).toString()
  ).join('');
  
  const emailShareData = {
    share,
    verificationCode,
    timestamp: Date.now()
  };
  
  const emailShare = btoa(JSON.stringify(emailShareData));
  
  return {
    emailShare,
    verificationCode
  };
}

/**
 * Extract share from email share data
 */
export function extractEmailShare(emailShare: string, verificationCode: string): string {
  try {
    const emailShareData = JSON.parse(atob(emailShare));
    
    if (emailShareData.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }
    
    // Check if share is not too old (optional security measure)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - emailShareData.timestamp > maxAge) {
      throw new Error('Email share has expired');
    }
    
    return emailShareData.share;
  } catch (error) {
    throw new Error('Invalid email share format');
  }
}
