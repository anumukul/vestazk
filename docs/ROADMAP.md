# VestaZK Roadmap

A privacy-preserving lending vault on Starknet - preventing liquidation hunting via ZK proofs.

## Project Overview

**Timeline**: Hackathon (Feb 1-28, 2026)  
**Track**: Starknet Re{define}  
**Goal**: Build a lending vault that protects users from liquidation hunting while maintaining privacy

---

## Phase 1: Foundation ✅ (COMPLETED)

### Tasks Completed
- [x] Project setup and initialization
- [x] Update project metadata (package.json, README)
- [x] Create documentation (SETUP.md, ARCHITECTURE.md)
- [x] Remove starknet-privacy-toolkit references

---

## Phase 2: Smart Contracts (IN PROGRESS)

### Current Status
- [x] VesuVault contract structure
- [x] Deposit function with Poseidon commitments
- [x] Withdraw function
- [x] Basic Merkle tree for commitments
- [x] Contract compiles successfully

### Remaining Tasks
- [ ] Add borrow function with ZK proof verification
- [ ] Add get_aggregate_health_factor function
- [ ] Add emergency_exit function
- [ ] Integrate with Vesu pool (supply/borrow)
- [ ] Integrate with Pragma oracle
- [ ] Add pause mechanism and reentrancy guards
- [ ] Deploy to Sepolia testnet

---

## Phase 3: ZK Circuit (IN PROGRESS)

### Current Status
- [x] Lending_proof Noir circuit created
- [x] Health factor verification logic
- [x] Merkle proof verification
- [x] Nullifier system
- [ ] Circuit compilation verification

### Remaining Tasks
- [ ] Compile circuit with nargo
- [ ] Generate verification key with Barretenberg
- [ ] Generate Garaga verifier contract
- [ ] Deploy verifier to Sepolia

---

## Phase 4: Frontend (PENDING)

### Planned Features
- [ ] Deposit page with commitment generation
- [ ] Borrow page with ZK proof generation
- [ ] Dashboard with aggregate vault stats
- [ ] Emergency exit page
- [ ] Wallet connection (ArgentX, Braavos)

---

## Phase 5: Integration & Testing (PENDING)

### Tasks
- [ ] Wire up all services
- [ ] End-to-end testing
- [ ] Deploy to Sepolia
- [ ] Demo video

---

## Project Summary

| Component | Status | Location |
|-----------|--------|----------|
| VesuVault Contract | Partial | `contracts/src/vesu_vault.cairo` |
| Lending Proof Circuit | Written | `zk-badges/lending_proof/` |
| Frontend Services | Partial | `src/vestazk-service.ts`, `src/pragma-service.ts` |

---

## Resources

- **GitHub**: https://github.com/anumukul/vestazk
- **Documentation**: See docs/ folder

---

**Built with ❤️ on Starknet**  
VestaZK - Privacy-Preserving Lending Vault
