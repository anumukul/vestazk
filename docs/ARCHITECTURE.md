# VestaZK Architecture

## Overview

VestaZK is a privacy-preserving lending vault built on Starknet using ZK proofs. It integrates with Vesu lending protocol to enable private borrowing against BTC collateral.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Deposit    │  │    Borrow    │  │    Dashboard    │  │
│  │   (Public)   │  │  (Private)   │  │  (Aggregate)    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────┬──────────────┬──────────────────┬─────────────┘
             │              │                  │
             v              v                  v
┌─────────────────────────────────────────────────────────────┐
│                    VestaZK Smart Contract                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VesuVault (Cairo)                                   │  │
│  │  • Deposit WBTC → Vesu                               │  │
│  │  • Generate commitment                                │  │
│  │  • Verify ZK proofs                                   │  │
│  │  • Borrow USDC from Vesu                             │  │
│  │  • Track aggregate health                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           v                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Garaga Verifier (Auto-generated from Noir)         │  │
│  │  • Verify UltraHonk proofs                           │  │
│  │  • Check public inputs                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             v                            v
┌─────────────────────────┐  ┌──────────────────────────────┐
│   Vesu Lending Pool     │  │   Commitment Registry        │
│   • Supply WBTC         │  │   • Merkle tree of positions │
│   • Borrow USDC         │  │   • Nullifier set            │
│   • Track collateral    │  │   • Only root on-chain       │
│   • Calculate health    │  │                              │
└─────────────────────────┘  └──────────────────────────────┘
             │
             v
┌─────────────────────────┐
│   Pragma Price Oracle   │
│   • BTC/USD price       │
│   • USDC/USD price      │
└─────────────────────────┘


                    Client-Side (Off-Chain)
┌─────────────────────────────────────────────────────────────┐
│                  ZK Proof Generation                        │
│                                                             │
│  ┌────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │   Noir     │ →  │  Barretenberg  │ →  │   Garaga     │ │
│  │  Circuit   │    │  Proof Gen     │    │   Calldata   │ │
│  │ (~10 lines)│    │  (30-60 sec)   │    │   Format     │ │
│  └────────────┘    └────────────────┘    └──────────────┘ │
│                                                             │
│  Private Inputs:                                            │
│  • owner_address, btc_amount, salt, merkle_path            │
│                                                             │
│  Public Inputs:                                             │
│  • merkle_root, borrow_amount, prices, health_min          │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Privacy Layer (From Toolkit - Preserved)

#### Tongo Contract
- **Purpose**: Private token transfers
- **Cryptography**: ElGamal encryption over Stark curve
- **No Trusted Setup**: Unlike SNARKs with CRS
- **Operations**:
  - Fund: Public entry (convert tokens to encrypted balance)
  - Transfer: Private (amount and recipient hidden)
  - Rollover: Private (claim incoming transfers)
  - Withdraw: Public exit (convert back to tokens)

#### Commitment System
```rust
commitment = Poseidon(owner_address, btc_amount, salt)
```

**Properties**:
- One-way function (can't reverse engineer inputs)
- Deterministic (same inputs → same output)
- Collision resistant
- 8× fewer constraints than Pedersen in circuits

**Storage**: Only Merkle root on-chain, not individual commitments

#### Merkle Tree
- **Type**: Incremental (supports efficient updates)
- **Depth**: 20 (supports 2^20 = ~1M positions)
- **Hashing**: Poseidon (ZK-friendly)
- **Storage**: Root hash only (~32 bytes on-chain)
- **Proofs**: ~20 sibling hashes per inclusion proof

### 2. Lending Layer (Our Extension - To Build)

#### VesuVault Contract

**State**:
```cairo
struct VaultState {
    merkle_root: felt252,           // Current commitment tree root
    total_deposited: u256,          // Aggregate WBTC
    total_borrowed: u256,           // Aggregate USDC
    commitment_count: u64,          // Number of positions
    nullifiers: Map<felt252, bool>, // Prevent replay attacks
    vesu_pool: ContractAddress,     // Vesu pool address
    verifier: ContractAddress,      // Garaga verifier
    min_health_factor: u256,        // e.g., 110 = 1.10
    buffer_percentage: u256,        // e.g., 120 = 120% aggregate health
}
```

**Key Functions**:

1. **deposit(amount: u256) → felt252**
   - Transfer WBTC from user
   - Supply WBTC to Vesu pool
   - Generate commitment: `Poseidon(caller, amount, random_salt)`
   - Add commitment to Merkle tree
   - Update merkle_root
   - Return commitment to user (CRITICAL: user must save this!)

2. **borrow(proof, public_inputs, recipient) → bool**
   - Verify proof via Garaga verifier
   - Check public_inputs.merkle_root == current_root
   - Check nullifier not used (replay protection)
   - Calculate new aggregate health after borrow
   - Require health >= (min_health * buffer / 100)
   - Borrow USDC from Vesu
   - Transfer USDC to recipient
   - Store nullifier

3. **get_aggregate_health_factor() → (u256, u256, u256)**
   - Query vault's Vesu collateral
   - Query vault's Vesu debt
   - Get prices from Pragma oracle
   - Calculate: health = (collateral_usd / debt_usd) * 100
   - Return (collateral_usd, debt_usd, health)
   - **PUBLIC VIEW**: Anyone can call this

4. **emergency_exit(proof, public_inputs) → bool**
   - Verify proof shows health > 150 (1.5×)
   - Calculate proportional vault share
   - Withdraw from Vesu
   - Transfer to user (minus 2% fee)
   - Remove commitment from tree

#### Integration with Vesu

**Required Calls**:
```cairo
// Supply collateral
IVesuPool.supply(asset: WBTC, amount: u256)

// Borrow against collateral
IVesuPool.borrow(asset: USDC, amount: u256)

// Query positions
IVesuPool.get_user_collateral(user: vault_address, asset: WBTC) → u256
IVesuPool.get_user_debt(user: vault_address, asset: USDC) → u256
```

**Key Insight**: Vault is the "user" from Vesu's perspective. Individual users are hidden behind the vault.

#### Integration with Pragma Oracle

```cairo
IPragmaOracle.get_data_median(data_type: 'BTC/USD') → PragmaPricesResponse
```

**Sepolia Address**: `0x2a85bd616f912537c50a49a4076db02c00b29b2cdc8a197ce92ed1837fa875b`

### 3. ZK Proof System

#### Noir Circuit (Our Extension)

Based on the `lending_proof` circuit, extended with health factor verification:

```rust
use std::hash::poseidon::bn254::hash_2;
use std::hash::poseidon::bn254::hash_3;

global HEALTH_DECIMALS: u64 = 100;

fn main(
    // Public inputs (visible on-chain)
    merkle_root: pub Field,
    borrow_amount: pub u64,
    btc_price: pub u64,           // 6 decimals, e.g., 65000000000
    usdc_price: pub u64,         // 6 decimals, e.g., 1000000
    min_health_factor: pub u64,  // e.g., 110 = 1.10
    nullifier: pub Field,
    
    // Private inputs (kept secret)
    owner_address: Field,
    btc_amount: u64,
    salt: Field,
    merkle_path: [Field; 20],
    merkle_indices: [u1; 20]
) {
    // Step 1: Prove commitment ownership
    let commitment = hash_3([
        owner_address,
        btc_amount as Field,
        salt
    ]);
    
    let computed_root = verify_merkle_proof(
        commitment,
        merkle_path,
        merkle_indices
    );
    
    assert(computed_root == merkle_root, "Invalid Merkle proof");
    
    // Step 2: Calculate health factor
    let collateral_usd = btc_amount * btc_price;
    let debt_usd = borrow_amount * usdc_price;
    
    assert(debt_usd > 0, "Debt cannot be zero");
    
    let health_factor = (collateral_usd * HEALTH_DECIMALS) / debt_usd;
    
    // Step 3: Verify health factor is sufficient
    assert(
        health_factor >= min_health_factor,
        "Health factor too low"
    );
    
    // Step 4: Verify nullifier (prevents replay)
    let expected_nullifier = hash_2([commitment, borrow_amount as Field]);
    assert(expected_nullifier == nullifier, "Invalid nullifier");
}

fn verify_merkle_proof(
    leaf: Field,
    path: [Field; 20],
    indices: [u1; 20]
) -> Field {
    let mut current = leaf;
    
    for i in 0..20 {
        let sibling = path[i];
        let is_right = indices[i];
        
        if is_right == 0 {
            current = hash_2([current, sibling]);
        } else {
            current = hash_2([sibling, current]);
        }
    }
    
    current
}
```

**Circuit Complexity**: ~20K constraints

**Proof Generation Time**: 30-60 seconds

**Key Extensions from donation_badge**:
- Added health factor calculation
- Added price inputs (BTC/USD, USDC/USD)
- Changed threshold check to health factor check
- Same Merkle proof verification (reused)

#### Garaga Verifier (Auto-Generated)

**Generation Process**:
```bash
# 1. Compile Noir circuit
cd zk-badges/lending_proof
nargo compile

# 2. Generate verification key
bb write_vk_ultra_keccak_honk_honk -b ./target/lending_proof.json

# 3. Generate Cairo verifier (THIS IS THE MAGIC)
source garaga-env/bin/activate
garaga gen \
    --system ultra_keccak_honk \
    --vk ./target/vk \
    --output ../../contracts/src/verifier.cairo
```

**Result**: `verifier.cairo` (~500 lines of auto-generated Cairo)

**Interface**:
```cairo
#[starknet::interface]
trait IVerifier<TContractState> {
    fn verify_ultra_keccak_honk_proof(
        self: @TContractState,
        full_proof_with_hints: Span<felt252>
    ) -> bool;
}
```

**Usage in VesuVault**:
```cairo
let verifier = IVerifierDispatcher { contract_address: self.verifier.read() };
let valid = verifier.verify_ultra_keccak_honk_proof(proof_calldata);
assert(valid, 'Invalid proof');
```

### 4. Frontend (Our Extension)

#### Proof Generation Flow

```typescript
// 1. User initiates borrow
const borrowAmount = "50000000000"; // 50,000 USDC (6 decimals)

// 2. Retrieve commitment data (stored locally)
const commitmentData = getStoredCommitment(userAddress);
// {
//   btcAmount: "100000000",  // 1 BTC (8 decimals)
//   salt: "0xabc123...",
//   merkleRoot: "0xdef456...",
//   merklePath: ["0x111...", "0x222...", ...],
//   merkleIndices: [0, 1, 0, 1, ...]
// }

// 3. Fetch current prices
const btcPrice = await fetchBTCPrice(); // From Pragma: "65000000000"
const usdcPrice = "1000000"; // $1 with 6 decimals

// 4. Generate ZK proof (client-side, 30-60 seconds)
const proof = await generateBorrowProof({
    // Private inputs
    owner_address: userAddress,
    btc_amount: commitmentData.btcAmount,
    salt: commitmentData.salt,
    merkle_path: commitmentData.merklePath,
    merkle_indices: commitmentData.merkleIndices,
    
    // Public inputs
    merkle_root: commitmentData.merkleRoot,
    borrow_amount: borrowAmount,
    btc_price: btcPrice,
    usdc_price: usdcPrice,
    min_health_factor: "110", // 1.10
});

// 5. Submit to contract
const vault = new VaultContract(vaultAddress);
const tx = await vault.borrow(
    proof.proof,              // ZK proof (Span<felt252>)
    proof.publicInputs,       // Public inputs struct
    userAddress              // Recipient (could be stealth address)
);

// 6. Wait for confirmation
await provider.waitForTransaction(tx.transaction_hash);
```

## Data Flow

### Deposit Flow

```
1. User clicks "Deposit 1 BTC"
2. Frontend:
   - Calls WBTC.approve(vault, 1 BTC)
   - Calls Vault.deposit(1 BTC)
3. VesuVault:
   - Transfers WBTC from user
   - Supplies WBTC to Vesu pool
   - Generates commitment = Poseidon(user, 1 BTC, random_salt)
   - Adds commitment to Merkle tree
   - Updates merkle_root on-chain
   - Emits DepositEvent(commitment)
4. Frontend:
   - Catches DepositEvent
   - Stores commitment data in localStorage:
     {
       commitment: "0xabc...",
       btcAmount: "100000000",
       salt: "0xdef...",
       merkleRoot: "0x123...",
       merklePath: [...],
       merkleIndices: [...]
     }
5. User sees: "Deposit successful! Save your commitment."

⚠️ CRITICAL: If user loses commitment data, they lose access to their position!
```

### Borrow Flow

```
1. User clicks "Borrow 50,000 USDC"
2. Frontend:
   - Retrieves commitment data from localStorage
   - Fetches BTC price from Pragma oracle
   - Calculates expected health factor client-side
   - Shows preview: "Your health factor will be 1.30"
3. User confirms
4. Frontend:
   - Generates ZK proof (30-60 seconds)
   - Shows progress: "Generating proof... 45%"
5. Proof generated
6. Frontend:
   - Calls Vault.borrow(proof, public_inputs, recipient)
7. VesuVault:
   - Verifies proof via Garaga verifier
   - Checks merkle_root matches current state
   - Checks nullifier not used
   - Calculates new aggregate health:
     - Old: collateral = 100 BTC, debt = 5M USDC, health = 130%
     - New: collateral = 100 BTC, debt = 5.05M USDC, health = 129%
   - Checks new health >= (110% * 120% buffer / 100) = 132%
     - Wait, 129% < 132%... REVERT!
   - (Assuming it passes) Borrows 50K USDC from Vesu
   - Transfers USDC to recipient
   - Stores nullifier
   - Emits BorrowEvent(nullifier, 50000)
8. User receives USDC

⚠️ Note: Individual health is private, but aggregate buffer must be maintained.
```

### Public View Flow

```
1. Anyone visits VestaZK dashboard
2. Frontend:
   - Calls Vault.get_aggregate_health_factor()
3. VesuVault:
   - Queries Vesu: vault's collateral
   - Queries Vesu: vault's debt
   - Queries Pragma: BTC price, USDC price
   - Calculates:
     - collateral_usd = collateral_btc * btc_price
     - debt_usd = debt_usdc * usdc_price
     - health = (collateral_usd / debt_usd) * 100
   - Returns (collateral_usd, debt_usd, health)
4. Frontend displays:
   - "Total Collateral: $6.5M"
   - "Total Debt: $5M"
   - "Aggregate Health: 130%"
   - "Status: Healthy ✓"

What observers SEE:
- Vault has $6.5M collateral
- Vault has $5M debt
- Vault is healthy

What observers DON'T SEE:
- How many individual users
- How much each user deposited
- Each user's liquidation price
- Who is at risk of liquidation
```

## Security Model

### Privacy Guarantees

**What's Hidden**:
- Individual collateral amounts
- Individual debt amounts
- Individual health factors
- Individual liquidation prices
- Link between user address and position size

**What's Public**:
- Vault's aggregate collateral
- Vault's aggregate debt
- Vault's aggregate health factor
- Transaction timestamps
- User addresses (but not their position sizes)

### Attack Vectors & Mitigations

#### 1. Replay Attacks

**Attack**: Reuse same proof multiple times

**Mitigation**: Nullifier system
```cairo
let nullifier = Poseidon(commitment, borrow_amount);
assert(!self.nullifiers.read(nullifier), 'Already used');
self.nullifiers.write(nullifier, true);
```

#### 2. Front-Running

**Attack**: Observer sees pending borrow transaction, front-runs with own borrow to push vault over limit

**Mitigation**: 
- Buffer percentage (vault maintains 120% health)
- Mempool privacy (future Starknet upgrade)

#### 3. Timing Analysis

**Attack**: Correlate deposit and borrow transactions by timing

**Mitigation**:
- Encourage users to add random delays
- Use stealth addresses for receiving USDC
- Batch operations where possible

#### 4. Amount Fingerprinting

**Attack**: Unique amounts (e.g., exactly 1.23456789 BTC) can link deposit to borrow

**Mitigation**:
- Recommend standard amounts (1 BTC, 0.5 BTC, etc.)
- Add random dust amounts
- User education about fingerprinting

### Trust Assumptions

1. **Vesu Protocol**: Smart contracts are secure, no backdoors
2. **Pragma Oracle**: Price feeds are honest and timely
3. **ZK System**: Proof soundness (discrete log is hard)
4. **Tongo**: Cryptography is correct (no trusted setup needed)
5. **Garaga**: Verifier correctly checks proofs

### Audit Status

- **Garaga**: Audited by CryptoExperts (June 2025)
- **Barretenberg**: Audited by Veridise (Bigfield primitives)
- **VestaZK Contracts**: NOT AUDITED (hackathon project)

⚠️ **WARNING**: Do not use on mainnet with real funds until audited.

## Performance Characteristics

### Gas Costs (Estimated)

| Operation | Gas | Notes |
|-----------|-----|-------|
| Deposit | ~150K | Merkle tree update |
| Borrow | ~250K | Proof verification |
| View Health | ~50K | Read-only |
| Emergency Exit | ~200K | Withdrawal + tree update |

### Proof Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Generation Time | 30-60 sec | Client-side, CPU-bound |
| Proof Size | ~8KB | Garaga calldata |
| Circuit Constraints | ~20K | Similar to donation_badge |
| Verification Time | <2 sec | On Starknet |

### Scalability Limits

| Limit | Value | Reason |
|-------|-------|--------|
| Max Positions | ~1M | Merkle tree depth 20 |
| Max Borrow TX/day | ~10K | Starknet block limit |
| Proof Generation | 1 at a time | CPU-bound |

## Future Extensions

### Phase 1 (Post-Hackathon)
- Multi-asset collateral (ETH, STRK)
- Partial liquidations
- Automated market maker for USDC

### Phase 2 (Production)
- Governance system (DAO)
- Flash loan protection
- Cross-chain bridging (Bitcoin via Garden Finance)
- Stealth address integration

### Phase 3 (Advanced)
- Recursive proofs (aggregate multiple borrows)
- Proof market (outsource generation)
- Privacy pool (mix with other users)
- Regulatory compliance (selective disclosure)

## Technical Debt

### Known Issues
1. No batch deposit/borrow (each tx separate)
2. Merkle tree not optimized (full recalculation on insert)
3. No circuit optimization (could reduce constraints by 30%)
4. Frontend stores commitments in localStorage (should use encrypted storage)
5. No rate limiting on proof generation

### Planned Improvements
1. Implement sparse Merkle tree for efficient updates
2. Optimize circuit with custom gates
3. Add encrypted commitment storage with user password
4. Implement proof generation queue
5. Add circuit formal verification

## References

### Academic Papers
- **Poseidon**: https://eprint.iacr.org/2019/458
- **Groth16**: https://eprint.iacr.org/2016/260
- **PLONK**: https://eprint.iacr.org/2019/953
- **ElGamal**: Taher Elgamal, "A public key cryptosystem..."

### Technical Resources
- **Garaga Docs**: https://garaga.gitbook.io/garaga
- **Noir Book**: https://noir-lang.org/docs
- **Cairo Book**: https://book.cairo-lang.org
- **Vesu Docs**: https://docs.vesu.xyz

---

VestaZK architecture for privacy-preserving lending on Starknet.
