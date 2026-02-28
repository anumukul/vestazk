# VestaZK

> Privacy-preserving lending vault on Starknet that prevents liquidation hunting.

Built on [starknet-privacy-toolkit](https://github.com/starknet-edu/starknet-privacy-toolkit) by Omar Espejel.

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

## Architecture

### From the Toolkit (Preserved)
- ✅ Tongo private transfers (Sepolia + Mainnet)
- ✅ Noir → Barretenberg → Garaga pipeline
- ✅ Commitment-based privacy system
- ✅ Poseidon hashing (8× fewer constraints than Pedersen)
- ✅ Deployed verifiers on Sepolia

### Our Extensions (Building)
- 🔄 VesuVault contract with deposit/borrow
- 🔄 Health factor ZK circuit (extends donation_badge)
- 🔄 Private borrowing interface
- 🔄 Aggregate health monitoring
- 🔄 Emergency exit mechanism

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Cairo | 2.6.3+ | Smart contracts |
| Noir | 1.0.0-beta.1 | ZK circuits (EXACT version) |
| Barretenberg | 0.67.0 | Proof generation (EXACT version) |
| Garaga | 0.15.5+ | Proof verification (EXACT version) |
| Vesu V2 | Latest | Lending protocol |
| Tongo | Latest | Private transfers |
| Next.js | 14+ | Frontend |
| Starknet | Sepolia/Mainnet | Layer 2 |

⚠️ **Version Locking**: Noir/BB/Garaga versions are EXACT. Different versions = different proof formats = verification fails. This is cryptography, not a bug.

## Quick Start

### Option A: GitHub Codespaces (Recommended)

**Why Codespaces?** Noir/BB/Garaga are sensitive to OS versions. Codespaces gives clean Linux environment that matches the toolchain.

```bash
# 1. Fork this repo on GitHub
# 2. Create Codespace
# 3. Run one command (30 minutes)
chmod +x setup-codespace.sh
./setup-codespace.sh

# 4. Verify installation
nargo --version    # 1.0.0-beta.1
bb --version       # 0.67.0
source garaga-env/bin/activate && garaga --version  # 0.15.5
```

### Option B: Local Setup (1 hour)

See [docs/SETUP.md](./docs/SETUP.md) for manual installation.

## Project Structure

```
vestazk/
├── contracts/                    # Cairo smart contracts
│   └── src/
│       └── vesu_vault.cairo     # OUR EXTENSION: Main vault
│
├── zk-badges/
│   ├── donation_badge/          # PRESERVED: Template circuit
│   └── lending_proof/           # OUR EXTENSION: Health factor circuit
│
├── src/                         # Frontend
│   ├── components/
│   │   └── BorrowInterface.tsx  # OUR EXTENSION
│   ├── tongo-client.ts          # PRESERVED: Tongo integration
│   └── badge-service.ts         # PRESERVED: Proof generation
│
├── deployments/                 # Contract addresses
│   └── sepolia.json
│
├── template/                    # PRESERVED: Minimal examples
│   ├── snippet.ts
│   └── quickstart.ts
│
├── setup-codespace.sh           # PRESERVED: Toolchain setup
└── docs/                        # Documentation
    ├── SETUP.md
    ├── ARCHITECTURE.md
    └── ROADMAP.md
```

## Development Workflow

### Testing Existing Toolkit Features

```bash
# 1. Health check
bun run check:health

# 2. Test Tongo
bun run tongo:init

# 3. Run quickstart
bun run template:quickstart

# 4. Test donation badge circuit
cd zk-badges/donation_badge
nargo test
```

### Building VestaZK Extensions

```bash
# Start proof API
source garaga-env/bin/activate
bun run api

# Start web UI (separate terminal)
bun run dev:web

# Run tests
make test
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
- Transfer amounts (encrypted on-chain)
- Exact donation/borrow amounts (only threshold revealed)
- Commitment binding (cannot reuse proofs)

**Not Protected:**
- Wallet addresses (still public)
- Transaction timing (visible on-chain)
- Badge/vault ownership (public)

For stronger privacy: use fresh wallets, don't reuse secrets, add delays.

### 4. The ZK Pipeline

```
Noir Circuit → Barretenberg → Garaga → Starknet
   (logic)     (proof gen)   (verifier)  (chain)
   ~10 lines   ~30-60 sec     ~8KB data
```

As OpenZeppelin explains: "Noir abstracts low-level cryptographic complexities, allowing developers to focus on logic rather than circuit optimization."

## Deployed Contracts (From Toolkit)

| Network | Contract | Address |
|---------|----------|---------|
| **Sepolia** | Donation Badge Verifier | `0x022b20fef3764d09293c5b377bc399ae7490e60665797ec6654d478d74212669` |
| Sepolia | Donation Badge | `0x077ca6f2ee4624e51ed6ea6d5ca292889ca7437a0c887bf0d63f055f42ad7010` |
| Sepolia | Tongo Contract | `0x00f34d7f4558e0634832e5fc3c3fc31f3ec55f8a` |
| **Mainnet** | Tongo Contract (USDC) | `0x00b921c1bdbe9c82f4822c651c633fe2d07d89b5879e3ba57e32f0a16` |

We'll deploy VesuVault to Sepolia for hackathon.

## Security

### Audited Components
- **Garaga**: [CryptoExperts audit](https://github.com/keep-starknet-strange/garaga/blob/main/docs/Garaga-audit-report-v2.pdf) (June 2025)
- **Barretenberg**: [Veridise audit](https://veridise.com/audits/) (Bigfield primitives)
- **Poseidon**: [Academic paper](https://eprint.iacr.org/2019/458) (8× fewer constraints than Pedersen)

### Trust Assumptions
- Vesu protocol is secure
- Pragma price oracle is honest
- ZK proof system is sound (discrete log hardness)
- Tongo cryptography is correct (no trusted setup needed)

Audits reduce risk but don't eliminate it. Always review versions.

## Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Fork starknet-privacy-toolkit
- [x] Clean commit history
- [x] Update project documentation
- [x] Verify toolkit features work

### Phase 2: Vesu Integration (Week 1)
- [ ] Create VesuVault contract
- [ ] Implement deposit with commitments
- [ ] Integrate with Vesu pool
- [ ] Write comprehensive tests
- [ ] Deploy to local devnet

### Phase 3: ZK Circuit (Week 1-2)
- [ ] Extend donation_badge circuit
- [ ] Add health factor constraints
- [ ] Test circuit edge cases
- [ ] Generate Garaga verifier
- [ ] Deploy verifier to Sepolia

### Phase 4: Contract Integration (Week 2)
- [ ] Implement borrow with proof verification
- [ ] Add nullifier system
- [ ] Implement emergency exit
- [ ] Full integration tests
- [ ] Deploy to Sepolia

### Phase 5: Frontend (Week 2)
- [ ] Build borrow interface
- [ ] Client-side proof generation
- [ ] Connect to Sepolia
- [ ] End-to-end testing
- [ ] Deploy to Vercel

### Phase 6: Submission (Week 2)
- [ ] Documentation complete
- [ ] Demo video recorded
- [ ] Blog post published
- [ ] Final testing
- [ ] Hackathon submission

## Resources

### The Toolkit
- **Tutorial**: https://espejel.bearblog.dev/starknet-privacy-toolkit/
- **Repo**: https://github.com/starknet-edu/starknet-privacy-toolkit
- **Live Demo**: https://starknet-privacy-toolkit.vercel.app/

### ZK Tools
- **Noir**: https://noir-lang.org/docs
- **Barretenberg**: https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg
- **Garaga**: https://garaga.gitbook.io/garaga

### Starknet
- **Vesu**: https://docs.vesu.xyz/developers
- **Tongo**: https://tongo.finance/docs
- **Cairo Book**: https://book.cairo-lang.org
- **Starknet Foundry**: https://foundry-rs.github.io/starknet-foundry/

## Contributing

This is a hackathon project (Feb 1-28, 2026) for Starknet Re{define}.

Development workflow:
1. Create feature branch
2. Write code + tests
3. Test thoroughly
4. Create PR to develop
5. After review, merge to main

## License

MIT

## Acknowledgments

Built on [Starknet Privacy Toolkit](https://github.com/starknet-edu/starknet-privacy-toolkit) by [Omar Espejel](https://twitter.com/omarespejel).

Special thanks to:
- StarkWare for Starknet
- Vesu team for lending protocol
- Garaga team for ZK verification
- Noir team for circuit language

---

**"The circuit is 10 lines. The contract is 30 lines. The infrastructure handles the hard parts. Fork it. Plug in your logic. Ship."** - Omar Espejel
