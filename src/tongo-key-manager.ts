/**
 * Tongo Private Key Manager
 * Handles generation, storage, and retrieval of Tongo private keys
 * For browser environment (localStorage) and Node.js (env vars)
 */

/**
 * Generate a random Tongo private key (32 bytes as hex string)
 * Validates that the key is within Stark curve scalar range
 */
export function generateTongoPrivateKey(): string {
  const starkCurveOrder = BigInt('3618502788666131213697322783095070105526743751716087489154079457884512865583');
  let key: string;
  let keyBigInt: bigint;
  
  // Generate key and ensure it's valid
  do {
    if (typeof window !== 'undefined' && (window as any).crypto) {
      // Browser environment - use Web Crypto API
      const array = new Uint8Array(32);
      (window as any).crypto.getRandomValues(array);
      key = '0x' + Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Node.js environment - use crypto module
      const { randomBytes } = require('crypto');
      key = '0x' + randomBytes(32).toString('hex');
    }
    
    keyBigInt = BigInt(key);
    // Keep generating until we get a valid key (should be very rare to need retry)
  } while (keyBigInt < 1n || keyBigInt >= starkCurveOrder);
  
  console.log('[KEY] Generated valid Tongo private key');
  return key;
}

/**
 * Get Tongo private key from storage or generate a new one
 * Browser: Uses localStorage
 * Node.js: Uses environment variables
 */
export function getOrCreateTongoKey(): string {
  if (typeof window !== 'undefined') {
    // Browser environment - use localStorage
    const storedKey = localStorage.getItem('tongo_private_key');
    if (storedKey && storedKey.trim() !== '' && storedKey !== 'your_tongo_private_key_here') {
      return storedKey;
    }
    
    // Generate new key
    const newKey = generateTongoPrivateKey();
    localStorage.setItem('tongo_private_key', newKey);
    return newKey;
  } else {
    // Node.js environment - use env vars or generate
    const envKey = process.env.TONGO_PRIVATE_KEY;
    if (envKey && envKey !== 'your_tongo_private_key_here' && envKey.trim() !== '') {
      return envKey;
    }
    
    // Generate new key (will be logged in config.ts)
    return generateTongoPrivateKey();
  }
}

/**
 * Save Tongo private key
 */
export function saveTongoKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tongo_private_key', key);
  } else {
    console.warn('Cannot save Tongo key in Node.js environment. Use .env file instead.');
  }
}

/**
 * Check if Tongo key exists
 */
export function hasTongoKey(): boolean {
  if (typeof window !== 'undefined') {
    const key = localStorage.getItem('tongo_private_key');
    return !!(key && key.trim() !== '' && key !== 'your_tongo_private_key_here');
  } else {
    const envKey = process.env.TONGO_PRIVATE_KEY;
    return !!(envKey && envKey !== 'your_tongo_private_key_here' && envKey.trim() !== '');
  }
}

