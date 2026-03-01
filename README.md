# VestaZK

> Privacy-preserving lending vault on Starknet that prevents liquidation hunting.

## The Problem

Public lending protocols expose every position:
- **Liquidation Hunting**: MEV bots monitor health factors and manipulate markets
- **Privacy Violation**: Your collateral, debt, and liquidation price are public
- **Institutional Barrier**: Whales avoid DeFi due to position transparency

## The Solution

VestaZK uses zero-knowledge proofs to prove "I can safely borrow" without revealing:
- How much collateral you deposited
- Your current debt level  
- Your specific liquidation price

**Only the vault's aggregate health factor is public. Individual positions stay private.**

## How It Works

```
User Deposits WBTC → VestaZK Vault → Vesu Lending Pool
                          ↓
                    ZK Proof System
                    (Noir + Garaga)
                          ↓
              "My health factor > 1.1" ✓
         (without revealing actual position)
```

### Privacy Model

1. **Commitment**: Hash your position: `Poseidon(amount, secret)`
2. **Proof**: Generate ZK proof: "My health > 1.1 after borrowing X"
3. **Verify**: Contract checks proof, executes borrow
4. **Privacy**: Observers only see aggregate vault health

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Cairo | 2.6.3+ | Smart contracts |
| Noir | 1.0.0+ | ZK circuits |
| Barretenberg | 3.0.0+ | Proof generation |
| Garaga | Latest | Proof verification |
| Vesu V2 | Latest | Lending protocol |
| Next.js | 14+ | Frontend |
| Starknet | Sepolia/Mainnet | Layer 2 |

⚠️ **Version Note**: ZK tool versions must be compatible. Different versions may produce incompatible proof formats.

## Quick Start

### Prerequisites

```bash
# Install Noir
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
nargo --version

# Install Barretenberg
npm install -g @aztec/bb

# Install Garaga
pip install garaga
```

### Run the Project

```bash
# Install dependencies
bun install

# Compile contracts
cd contracts
scarb build

# Compile ZK circuit
cd zk-badges/lending_proof
nargo compile

# Start web UI
bun run dev:web
```

## Project Structure

```
vestazk/
├── contracts/                    # Cairo smart contracts
│   └── src/
│       └── vesu_vault.cairo     # Main vault contract
│       └── ivesu.cairo         # Vesu pool interface
│       └── ipragma.cairo       # Price oracle interface
│
├── zk-badges/
│   └── lending_proof/          # Health factor ZK circuit
│
├── src/                         # Frontend services
│   ├── vestazk-service.ts      # Vault interactions
│   ├── proof-generator.ts      # ZK proof generation
│   └── commitment-storage.ts   # Encrypted storage
│
├── app/                         # Next.js frontend
│   ├── page.tsx                # Landing page
│   ├── deposit/page.tsx        # Deposit interface
│   ├── borrow/page.tsx         # Borrow interface
│   └── dashboard/page.tsx      # Vault dashboard
│
├── deployments/                 # Contract addresses
│   └── sepolia.json
│
└── docs/                       # Documentation
    ├── SETUP.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

## Development Commands

```bash
# Health check
bun run check:health

# Deploy contracts to Sepolia
cd contracts
sncast deploy ...

# Generate ZK verifier
cd zk-badges/lending_proof
nargo compile
bb write_vk_ultra_keccak_honk -b ./target/lending_proof.json -o ./target/vk
garaga gen --system ultra_keccak_honk --vk ./target/vk --output ../../contracts/src/verifier.cairo

# Run frontend
bun run dev:web
```

## Key Concepts

### 1. Commitments (Sealed Envelopes)

```rust
commitment = Poseidon(amount, secret)
```

Like sealing a letter - envelope is visible, contents are hidden. One-way function: can't reverse engineer inputs from commitment.

### 2. ZK Proofs (Wristbands)

Prove you're allowed without showing ID. The proof reveals NOTHING about actual values. Not encrypted data - completely different object.

### 3. Privacy Guarantees

**Protected:**
- Collateral amounts (hidden)
- Debt levels (hidden)
- Individual health factors (hidden)
- Liquidation prices (hidden)

**Not Protected:**
- Wallet addresses (public)
- Transaction timing (visible on-chain)
- Aggregate vault health (public)

### 4. The ZK Pipeline

```
Noir Circuit → Barretenberg → Garaga → Starknet
   (logic)     (proof gen)   (verifier)  (chain)
```

## Deployed Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Sepolia | VesuVault | (To be deployed) |
| Sepolia | Lending Verifier | (To be deployed) |
| Sepolia | WBTC | `0x00452bd5c0512a61df7c7be8cfea5e4f893cb40e126bdc40aee6054db955129e` |

## Security

### Audited Components
- **Garaga**: CryptoExperts audit (June 2025)
- **Barretenberg**: Veridise audit (Bigfield primitives)
- **Poseidon**: Academic paper (8× fewer constraints than Pedersen)

### Trust Assumptions
- Vesu protocol is secure
- Pragma price oracle is honest
- ZK proof system is sound (discrete log hardness)

⚠️ **WARNING**: This is a hackathon project. NOT AUDITED. Do not use with real funds until fully audited.

## Roadmap

### Phase 1: Foundation ✅ (COMPLETED)
- [x] Project setup
- [x] Documentation
- [x] Basic vault contract

### Phase 2: Core Features (IN PROGRESS)
- [x] VesuVault contract with deposit
- [ ] Borrow with ZK proof verification
- [ ] Aggregate health tracking
- [ ] Emergency exit mechanism

### Phase 3: ZK Circuit
- [x] Lending proof circuit
- [ ] Generate Garaga verifier
- [ ] Deploy verifier to Sepolia

### Phase 4: Frontend
- [ ] Deposit page
- [ ] Borrow page with proof generation
- [ ] Dashboard with aggregate stats

### Phase 5: Deployment
- [ ] Deploy to Sepolia testnet
- [ ] End-to-end testing

## Resources

### ZK Tools
- **Noir**: https://noir-lang.org/docs
- **Barretenberg**: https://github.com/AztecProtocol/aztec-packages
- **Garaga**: https://garaga.gitbook.io/garaga

### Starknet
- **Vesu**: https://docs.vesu.xyz/developers
- **Cairo Book**: https://book.cairo-lang.org
- **Starknet Foundry**: https://foundry-rs.github.io/starknet-foundry/

## Contributing

This is a hackathon project (Feb 2026) for Starknet Re{Define}.

Development workflow:
1. Create feature branch
2. Write code + tests
3. Test thoroughly
4. Create PR
5. After review, merge to main

## License

MIT

## Contact

- GitHub: https://github.com/anumukul/vestazk
- Issues: https://github.com/anumukul/vestazk/issues
