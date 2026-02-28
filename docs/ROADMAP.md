# VestaZK Roadmap

A privacy-preserving lending vault on Starknet - preventing liquidation hunting via ZK proofs.

## Project Overview

**Timeline**: Hackathon (Feb 1-28, 2026)  
**Track**: Starknet Re{define}  
**Goal**: Build a lending vault that protects users from liquidation hunting while maintaining privacy

---

## Phase 1: Foundation ✅ (COMPLETED)

### Objectives
- Fork and clean the starknet-privacy-toolkit repository
- Establish VestaZK project identity
- Verify toolkit features work correctly

### Tasks Completed

| Task | Status | Notes |
|------|--------|-------|
| Fork starknet-privacy-toolkit | ✅ | Repository cloned |
| Clean commit history | ✅ | Fresh git history created |
| Update project metadata | ✅ | package.json, README updated |
| Create documentation | ✅ | SETUP.md, ARCHITECTURE.md |
| Verify toolkit features | ✅ | Health check passing |

### Deliverables
- Fresh git repository with no external history
- Updated package.json with `vestazk` name and proper metadata
- Complete README.md with project description
- docs/SETUP.md for development environment setup
- docs/ARCHITECTURE.md with technical architecture

---

## Phase 2: Vesu Integration (Week 1)

### Objectives
- Create the VesuVault smart contract
- Implement deposit functionality with commitments
- Integrate with Vesu lending pool
- Deploy to local devnet for testing

### Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Create VesuVault contract structure | 🔄 | High | Basic contract with state |
| Implement deposit with commitments | 🔄 | High | Generate Poseidon commitments |
| Integrate with Vesu pool | 🔄 | High | Supply WBTC to Vesu |
| Implement Merkle tree | 🔄 | High | Track commitments on-chain |
| Write comprehensive tests | 🔄 | Medium | Unit tests for all functions |
| Deploy to local devnet | 🔄 | Medium | Test full flow |

### Technical Details

#### VesuVault Contract Structure
```cairo
#[starknet::contract]
mod vesu_vault {
    struct Storage {
        merkle_root: felt252,
        total_deposited: u256,
        total_borrowed: u256,
        commitment_count: u64,
        nullifiers: Map<felt252, bool>,
        vesu_pool: ContractAddress,
        verifier: ContractAddress,
        min_health_factor: u256,
        buffer_percentage: u256,
    }
}
```

#### Deposit Flow
1. User calls `deposit(amount)`
2. Contract transfers WBTC from user
3. Contract supplies WBTC to Vesu pool
4. Contract generates commitment: `Poseidon(caller, amount, random_salt)`
5. Contract adds commitment to Merkle tree
6. Contract updates `merkle_root`
7. Contract returns commitment to user

---

## Phase 3: ZK Circuit (Week 1-2)

### Objectives
- Extend donation_badge circuit with health factor logic
- Generate Garaga verifier contract
- Deploy verifier to Sepolia

### Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Extend donation_badge circuit | 🔄 | High | Add health factor constraints |
| Add price inputs to circuit | 🔄 | High | BTC/USD, USDC/USD |
| Implement nullifier in circuit | 🔄 | High | Prevent replay attacks |
| Test circuit edge cases | 🔄 | Medium | Boundary conditions |
| Generate Garaga verifier | 🔄 | High | Auto-generate Cairo code |
| Deploy verifier to Sepolia | 🔄 | High | Make it publicly available |

### Circuit Design

```rust
// Extended from donation_badge (10 lines → ~50 lines)
// Key additions:
// 1. Health factor calculation
// 2. Price inputs (BTC, USDC)
// 3. Nullifier generation
// 4. Merkle proof verification
```

**Expected Constraints**: ~20K (similar to donation_badge)  
**Proof Time**: 30-60 seconds  
**Proof Size**: ~8KB

---

## Phase 4: Contract Integration (Week 2)

### Objectives
- Implement borrow with ZK proof verification
- Add nullifier system for replay protection
- Implement emergency exit mechanism
- Deploy to Sepolia testnet

### Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Implement borrow with proof verification | 🔄 | High | Verify Garaga proofs |
| Add nullifier system | 🔄 | High | Prevent proof reuse |
| Implement emergency exit | 🔄 | Medium | Allow withdrawals with penalty |
| Full integration tests | 🔄 | High | End-to-end testing |
| Deploy to Sepolia | 🔄 | High | Public testnet deployment |

### Borrow Flow
1. User generates ZK proof (client-side, 30-60 sec)
2. User calls `borrow(proof, public_inputs, recipient)`
3. Contract verifies proof via Garaga verifier
4. Contract checks merkle_root matches
5. Contract checks nullifier not used
6. Contract calculates new aggregate health
7. Contract verifies health >= buffer
8. Contract borrows USDC from Vesu
9. Contract transfers USDC to recipient
10. Contract stores nullifier

---

## Phase 5: Frontend (Week 2)

### Objectives
- Build user-friendly borrow interface
- Implement client-side proof generation
- Connect to Sepolia testnet
- Deploy to Vercel

### Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Build BorrowInterface component | 🔄 | High | React component for borrowing |
| Implement proof generation client-side | 🔄 | High | Use Noir + Barretenberg |
| Add price fetching from Pragma | 🔄 | Medium | Real-time oracle data |
| Connect to Sepolia | 🔄 | High | Testnet integration |
| End-to-end testing | 🔄 | High | Full user flow |
| Deploy to Vercel | 🔄 | Medium | Public frontend |

### Frontend Features
- Dashboard showing aggregate vault health
- Deposit interface (public)
- Borrow interface (private, with proof generation)
- Commitment storage (localStorage)
- Transaction status tracking

---

## Phase 6: Submission (Week 2)

### Objectives
- Complete all documentation
- Record demo video
- Publish blog post
- Final testing and polish

### Tasks

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Documentation complete | 🔄 | High | All docs reviewed |
| Demo video recorded | 🔄 | High | 2-3 min walkthrough |
| Blog post published | 🔄 | Medium | Technical deep dive |
| Final testing | 🔄 | High | Bug fixes |
| Hackathon submission | 🔄 | High | Submit to Starknet Re{defense} |

---

## Milestones

### Milestone 1: Foundation Ready (Feb 7)
- [x] Repository cleaned and ready
- [x] Documentation written
- [x] Environment verified

### Milestone 2: Contracts Deployed (Feb 14)
- [ ] VesuVault deployed to devnet
- [ ] Verifier deployed to Sepolia
- [ ] Basic tests passing

### Milestone 3: Full Integration (Feb 21)
- [ ] Borrow flow working end-to-end
- [ ] Proof generation working
- [ ] Frontend connected

### Milestone 4: Hackathon Submission (Feb 28)
- [ ] Demo video ready
- [ ] All tests passing
- [ ] Deployed to Sepolia

---

## Technical Dependencies

### Version Lock (CRITICAL)
| Component | Version | Why |
|-----------|---------|-----|
| Noir | 1.0.0-beta.1 | EXACT - different versions = different proofs |
| Barretenberg | 0.67.0 | EXACT - cryptographic compatibility |
| Garaga | 0.15.5+ | Latest stable |
| Cairo | 2.6.3+ | Contract compatibility |
| Scarb | 2.6.3+ | Cairo package manager |

### External Integrations
| Service | Network | Purpose |
|---------|---------|---------|
| Vesu V2 | Sepolia | Lending pool |
| Pragma Oracle | Sepolia | Price feeds |
| Tongo | Sepolia | Private transfers (optional) |

---

## Resources

### Documentation
- [SETUP.md](./SETUP.md) - Development environment
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details

### External Links
- [Toolkit Tutorial](https://espejel.bearblog.dev/starknet-privacy-toolkit/)
- [Noir Docs](https://noir-lang.org/docs)
- [Garaga Docs](https://garaga.gitbook.io/garaga)
- [Vesu Docs](https://docs.vesu.xyz)

---

## Success Criteria

1. **Privacy**: User collateral and debt amounts are not visible on-chain
2. **Security**: ZK proofs correctly verify health factors without revealing data
3. **Usability**: Frontend provides clear interface for deposit/borrow flow
4. **Integration**: Successfully integrates with Vesu lending pool
5. **Demo**: Working end-to-end demo on Sepolia testnet

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ZK proof generation too slow | Medium | Use Codespaces with better CPU |
| Vesu integration changes | High | Build abstraction layer |
| Version conflicts | High | Use exact versions specified |
| Circuit complexity | Medium | Start with simple health factor |

---

**Last Updated**: Feb 28, 2026
