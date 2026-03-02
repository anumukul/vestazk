import { RpcProvider, Account, Contract, hash, uint256 } from 'starknet';

const VESTA_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "amount", type: "u256" }],
    outputs: [{ name: "commitment", type: "felt252" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "commitment", type: "felt252" },
      { name: "amount", type: "u256" }
    ],
    outputs: [{ name: "success", type: "bool" }],
    state_mutability: "external"
  },
  {
    type: "function",
    name: "get_merkle_root",
    inputs: [],
    outputs: [{ name: "root", type: "felt252" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_commitment_count",
    inputs: [],
    outputs: [{ name: "count", type: "u64" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "is_nullifier_used",
    inputs: [{ name: "nullifier", type: "felt252" }],
    outputs: [{ name: "used", type: "bool" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_total_deposited",
    inputs: [],
    outputs: [{ name: "total", type: "u256" }],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_user_deposit",
    inputs: [{ name: "commitment", type: "felt252" }],
    outputs: [
      { name: "amount", type: "u256" },
      { name: "salt", type: "felt252" }
    ],
    state_mutability: "view"
  },
  {
    type: "function",
    name: "get_commitment",
    inputs: [{ name: "user", type: "contract_address" }],
    outputs: [{ name: "commitment", type: "felt252" }],
    state_mutability: "view"
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "user", type: "contract_address" },
      { name: "amount", type: "u256" },
      { name: "commitment", type: "felt252" }
    ]
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "user", type: "contract_address" },
      { name: "amount", type: "u256" },
      { name: "commitment", type: "felt252" }
    ]
  }
];

export const VAULT_ADDRESS = '0x015c9604f376571298381973b32cca3b3aef65eb7e8466b222573a95e6d5e897';
export const WBTC_ADDRESS = '0x07d0fc03b7853f9dad8bb8a5bcac9ad8716c464428298f3770c909a11520061c';
export const USDC_ADDRESS = '0x017947ec3c751a4aacca5b86aba3d809902455fcc0008e3b1433e69ea60851a4';
export const VERIFIER_ADDRESS = '0x0636258d58083ae4dd2e83a39316cb8e8d36907aa25e115881ece3ecad197879';
export const PRAGMA_ORACLE_ADDRESS = '0x36031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a';

export interface VaultStats {
  merkleRoot: string;
  commitmentCount: number;
  totalDeposited: bigint;
}

export class VestazkService {
  private provider: RpcProvider;
  private account: Account | null = null;
  private vaultContract: Contract;

  constructor() {
    const rpcUrl = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel';
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    this.vaultContract = new Contract(VESTA_VAULT_ABI, VAULT_ADDRESS, this.provider);
  }

  setAccount(account: Account) {
    this.account = account;
    this.vaultContract.connect(account);
  }

  setAccountFromWallet(wallet: any) {
    this.vaultContract.connect(wallet);
  }

  async deposit(amount: bigint): Promise<{ commitment: string; txHash: string }> {
    const wallet = window.starknet;
    if (!wallet?.selectedAddress) {
      throw new Error('Wallet not connected');
    }

    const tx = await this.vaultContract.deposit(amount);
    await this.provider.waitForTransaction(tx.transaction_hash);

    const receipt = await this.provider.getTransactionReceipt(tx.transaction_hash);
    
    const depositedEvent = receipt.events.find(
      (e: any) => e.keys[0] === hash.getSelectorByName('Deposited')
    );

    const commitment = depositedEvent?.data[2] || '0x0';

    return {
      commitment,
      txHash: tx.transaction_hash
    };
  }

  async withdraw(commitment: string, amount: bigint): Promise<{ txHash: string }> {
    const wallet = window.starknet;
    if (!wallet?.selectedAddress) {
      throw new Error('Wallet not connected');
    }

    this.vaultContract.connect(wallet);
    const tx = await this.vaultContract.withdraw(commitment, amount);
    await this.provider.waitForTransaction(tx.transaction_hash);

    return { txHash: tx.transaction_hash };
  }

  async getVaultStats(): Promise<VaultStats> {
    const [merkleRoot, commitmentCount, totalDeposited] = await Promise.all([
      this.vaultContract.get_merkle_root(),
      this.vaultContract.get_commitment_count(),
      this.vaultContract.get_total_deposited()
    ]);

    return {
      merkleRoot,
      commitmentCount: Number(commitmentCount),
      totalDeposited: uint256.uint256ToBigInt(totalDeposited as any)
    };
  }

  async getUserCommitment(userAddress: string): Promise<string> {
    return await this.vaultContract.get_commitment(userAddress);
  }

  isConnected(): boolean {
    return typeof window !== 'undefined' && !!window.starknet?.selectedAddress;
  }

  getWalletAddress(): string | null {
    return window.starknet?.selectedAddress || null;
  }
}

let serviceInstance: VestazkService | null = null;

export function getVestazkService(): VestazkService {
  if (!serviceInstance) {
    serviceInstance = new VestazkService();
  }
  return serviceInstance;
}
