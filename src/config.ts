import { RpcProvider, Account } from 'starknet';

// Only import Node.js modules in Node.js environment
let dotenv: any = null;
let randomBytes: ((size: number) => Buffer) | null = null;

if (typeof window === 'undefined') {
  // Node.js environment
  dotenv = require('dotenv');
  const crypto = require('crypto');
  randomBytes = crypto.randomBytes;
  dotenv.config();

  // Debug logging for environment variables (Node.js only)
  // Note: Sensitive values are masked for security
  if (process.env) {
    console.log('[CONFIG] Loading environment variables...');
    console.log('[CONFIG] STARKNET_RPC_URL:', process.env.STARKNET_RPC_URL ? 'SET' : 'Using default');
    console.log('[CONFIG] STARKNET_ACCOUNT_ADDRESS:', process.env.STARKNET_ACCOUNT_ADDRESS ? 'SET' : 'NOT SET');
    console.log('[CONFIG] STARKNET_PRIVATE_KEY:', process.env.STARKNET_PRIVATE_KEY ? 'SET' : 'NOT SET');
    console.log('[CONFIG] TONGO_CONTRACT_ADDRESS:', process.env.TONGO_CONTRACT_ADDRESS || 'Using default');
    console.log('[CONFIG] TONGO_PRIVATE_KEY:', process.env.TONGO_PRIVATE_KEY ? 'SET' : 'Will auto-generate');
  }
}

// Get environment variables (works in both Node.js and browser via Vite)
function getEnv(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    // Node.js environment
    return process.env[key] || defaultValue;
  } else {
    // Browser environment - Vite exposes env vars via import.meta.env
    // For now, use defaults in browser (wallet config will override)
    return defaultValue;
  }
}

export const STARKNET_RPC_URL = getEnv('STARKNET_RPC_URL', 
  'https://sepolia.starknet.io/rpc/v0_8_1');

export const TONGO_CONTRACT_ADDRESS = getEnv('TONGO_CONTRACT_ADDRESS',
  '0x00b4cca30f0f641e01140c1c388f55641f1c3fe5515484e622b6cb91d8cee585');

export const STRK_ADDRESS = getEnv('STRK_ADDRESS',
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d');

// Provider and account are only used in Node.js (CLI demo)
// Browser uses wallet-config.ts instead
export const provider = typeof window === 'undefined' ? new RpcProvider({
  nodeUrl: STARKNET_RPC_URL
}) : null;

export const starknetAccount = typeof window === 'undefined' && process.env.STARKNET_ACCOUNT_ADDRESS && process.env.STARKNET_PRIVATE_KEY
  ? new Account({
      provider: provider!,
      address: process.env.STARKNET_ACCOUNT_ADDRESS,
      signer: process.env.STARKNET_PRIVATE_KEY
    })
  : null;

/**
 * Generate a random Tongo private key (32 bytes as hex string)
 * Browser-safe version uses Web Crypto API
 */
function generateTongoPrivateKey(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment - use Web Crypto API
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return '0x' + Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } else if (randomBytes) {
    // Node.js environment - use crypto module
    return '0x' + randomBytes(32).toString('hex');
  } else {
    throw new Error('Cannot generate random bytes - no crypto available');
  }
}

/**
 * Get Tongo private key from environment or generate a new one
 * If auto-generated, it will be logged so the user can save it
 * NOTE: In browser, this should use tongo-key-manager.ts instead
 */
export const tongoPrivateKey = (() => {
  // In browser, don't use this - use tongo-key-manager.ts instead
  if (typeof window !== 'undefined') {
    // Return a placeholder - browser code should use tongo-key-manager
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  // Node.js environment
  const envKey = process.env.TONGO_PRIVATE_KEY;
  
  if (envKey && envKey !== 'your_tongo_private_key_here' && envKey.trim() !== '') {
    return envKey;
  }
  
  // Auto-generate a new key (Node.js only)
  const generatedKey = generateTongoPrivateKey();
  console.log('\n🔑 TONGO PRIVATE KEY AUTO-GENERATED');
  console.log('='.repeat(60));
  console.log(`Generated Key: ${generatedKey}`);
  console.log('\n⚠️  IMPORTANT: Save this key to your .env file as TONGO_PRIVATE_KEY');
  console.log('⚠️  If you lose this key, you will lose access to your Tongo account!');
  console.log('='.repeat(60) + '\n');
  
  return generatedKey;
})();

