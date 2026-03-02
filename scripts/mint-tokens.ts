import { Account, RpcProvider, Contract, ec } from "starknet";

// Configuration
const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel";
const WBTC_ADDRESS = "0x07d0fc03b7853f9dad8bb8a5bcac9ad8716c464428298f3770c909a11520061c";
const USDC_ADDRESS = "0x017947ec3c751a4aacca5b86aba3d809902455fcc0008e3b1433e69ea60851a4";

const DEPLOYER_ADDRESS = "0x550a0c6f33884299b8ae150c17c4c9409bce3873d61183e47aa652562ad7c5c";

// ERC20 ABI (minimal for minting)
const ERC20_ABI = [
  "fn mint(to: core::starknet::contract_address::ContractAddress, amount: u256) -> bool",
  "fn balance_of(account: core::starknet::contract_address::ContractAddress) -> u256"
];

async function main() {
  // Get recipient address from command line
  const recipient = process.argv[2];
  if (!recipient) {
    console.log("Usage: npx tsx scripts/mint-tokens.ts <RECIPIENT_ADDRESS>");
    console.log("Example: npx tsx scripts/mint-tokens.ts 0x123...");
    process.exit(1);
  }

  console.log("Recipient:", recipient);

  // Connect to Sepolia
  const provider = new RpcProvider({ nodeUrl: RPC_URL });

  // Get deployer account (needs private key in .env)
  // For now, we'll use the already deployed account
  console.log("\nMinting tokens to:", recipient);

  // WBTC - Mint 1 WBTC (8 decimals = 100000000)
  const wbtc = new Contract(ERC20_ABI, WBTC_ADDRESS, provider);
  
  try {
    console.log("\nMinting 1 WBTC...");
    // Note: This will fail if the deployer key is not available
    // In production, you'd use the deployer account
    console.log("WBTC mint call prepared for:", WBTC_ADDRESS);
    console.log("Recipient will receive: 1 WBTC (100000000 in smallest units)");
  } catch (e) {
    console.error("Error:", e);
  }

  // USDC - Mint 50000 USDC (6 decimals = 50000000000)
  const usdc = new Contract(ERC20_ABI, USDC_ADDRESS, provider);
  
  try {
    console.log("\nMinting 50000 USDC...");
    console.log("USDC mint call prepared for:", USDC_ADDRESS);
    console.log("Recipient will receive: 50000 USDC (50000000000 in smallest units)");
  } catch (e) {
    console.error("Error:", e);
  }

  console.log("\n⚠️  To actually mint, you need to invoke the mint function from the deployer wallet.");
  console.log("   Or deploy a new ERC20 with yourself as owner.");
}

main();
