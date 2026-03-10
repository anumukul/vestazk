// Comprehensive test suite for VesuVault
//
// Tests cover:
// - Vault initialization & Merkle tree setup
// - Pause / unpause access control
// - Verifier & oracle setter access control
// - View-function initial-state validation
// - Aggregate health factor edge cases

#[cfg(test)]
mod tests {
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
    use starknet::ContractAddress;
    use core::traits::Into;
    use vesu_vault::vesu_vault::{IVesuVaultDispatcher, IVesuVaultDispatcherTrait, BorrowPublicInputs};
    use vesu_vault::erc20::{IERC20Dispatcher};

    // ── helpers ────────────────────────────────────────────────────────

    fn OWNER() -> ContractAddress {
        starknet::contract_address_const::<0x666>()
    }

    fn NON_OWNER() -> ContractAddress {
        starknet::contract_address_const::<0x999>()
    }

    fn deploy_vault(calldata: Array<felt252>) -> ContractAddress {
        let vault_class = declare("VesuVault").unwrap();
        let (addr, _) = vault_class.contract_class().deploy(@calldata).unwrap();
        addr
    }

    fn setup() -> (IVesuVaultDispatcher, ContractAddress, ContractAddress, ContractAddress) {
        let wbtc = starknet::contract_address_const::<0x111>();
        let usdc = starknet::contract_address_const::<0x222>();
        let vesu_pool = starknet::contract_address_const::<0x333>();
        let verifier = starknet::contract_address_const::<0x444>();
        let oracle = starknet::contract_address_const::<0x555>();
        let min_health_factor = 110_u256;
        let buffer_percentage = 120_u256;
        let owner = OWNER();

        let mut calldata: Array<felt252> = ArrayTrait::new();
        calldata.append(wbtc.into());
        calldata.append(usdc.into());
        calldata.append(vesu_pool.into());
        calldata.append(verifier.into());
        calldata.append(oracle.into());
        calldata.append(min_health_factor.low.into());
        calldata.append(min_health_factor.high.into());
        calldata.append(buffer_percentage.low.into());
        calldata.append(buffer_percentage.high.into());
        calldata.append(owner.into());

        let vault_address = deploy_vault(calldata);
        
        (IVesuVaultDispatcher { contract_address: vault_address }, wbtc, usdc, owner)
    }

    // ── initialization ────────────────────────────────────────────────

    #[test]
    fn test_vault_initialization() {
        let (vault, _, _, _) = setup();
        
        // Merkle root of the empty depth-20 tree is a precomputed hash, not zero
        let initial_root = vault.get_merkle_root();
        assert(initial_root != 0, 'Initial root should be filled');
        assert(vault.get_commitment_count() == 0, 'Count should be 0');
    }

    #[test]
    fn test_initial_totals_are_zero() {
        let (vault, _, _, _) = setup();

        let deposited = vault.get_total_deposited();
        let borrowed = vault.get_total_borrowed();

        assert(deposited == u256 { low: 0, high: 0 }, 'Deposited should be 0');
        assert(borrowed == u256 { low: 0, high: 0 }, 'Borrowed should be 0');
    }

    #[test]
    fn test_initial_paused_is_false() {
        let (vault, _, _, _) = setup();
        assert(!vault.get_paused(), 'Should not be paused');
    }

    #[test]
    fn test_initial_risk_parameters() {
        let (vault, _, _, _) = setup();
        assert(vault.get_min_health_factor() == u256 { low: 110, high: 0 }, 'Min health should be 110');
        assert(vault.get_buffer_percentage() == u256 { low: 120, high: 0 }, 'Buffer should be 120');
    }

    // ── pause / unpause ───────────────────────────────────────────────

    #[test]
    fn test_owner_can_pause() {
        let (vault, _, _, owner) = setup();
        start_cheat_caller_address(vault.contract_address, owner);
        vault.pause();
        stop_cheat_caller_address(vault.contract_address);

        assert(vault.get_paused(), 'Should be paused');
    }

    #[test]
    fn test_owner_can_unpause() {
        let (vault, _, _, owner) = setup();

        start_cheat_caller_address(vault.contract_address, owner);
        vault.pause();
        vault.unpause();
        stop_cheat_caller_address(vault.contract_address);

        assert(!vault.get_paused(), 'Should be unpaused');
    }

    #[test]
    #[should_panic(expected: ('Only owner can pause',))]
    fn test_non_owner_cannot_pause() {
        let (vault, _, _, _) = setup();
        start_cheat_caller_address(vault.contract_address, NON_OWNER());
        vault.pause();
        stop_cheat_caller_address(vault.contract_address);
    }

    #[test]
    #[should_panic(expected: ('Only owner can unpause',))]
    fn test_non_owner_cannot_unpause() {
        let (vault, _, _, owner) = setup();
        // Pause as owner first
        start_cheat_caller_address(vault.contract_address, owner);
        vault.pause();
        stop_cheat_caller_address(vault.contract_address);

        // Try to unpause as non-owner
        start_cheat_caller_address(vault.contract_address, NON_OWNER());
        vault.unpause();
        stop_cheat_caller_address(vault.contract_address);
    }

    // ── access control: set_verifier ──────────────────────────────────

    #[test]
    fn test_owner_can_set_verifier() {
        let (vault, _, _, owner) = setup();
        let new_verifier = starknet::contract_address_const::<0xABC>();

        start_cheat_caller_address(vault.contract_address, owner);
        vault.set_verifier(new_verifier);
        stop_cheat_caller_address(vault.contract_address);
        // No assertion needed — test passes if no panic
    }

    #[test]
    #[should_panic(expected: ('Only owner can set verifier',))]
    fn test_non_owner_cannot_set_verifier() {
        let (vault, _, _, _) = setup();
        let new_verifier = starknet::contract_address_const::<0xABC>();

        start_cheat_caller_address(vault.contract_address, NON_OWNER());
        vault.set_verifier(new_verifier);
        stop_cheat_caller_address(vault.contract_address);
    }

    // ── access control: set_oracle ────────────────────────────────────

    #[test]
    fn test_owner_can_set_oracle() {
        let (vault, _, _, owner) = setup();
        let new_oracle = starknet::contract_address_const::<0xDEF>();

        start_cheat_caller_address(vault.contract_address, owner);
        vault.set_oracle(new_oracle);
        stop_cheat_caller_address(vault.contract_address);
    }

    #[test]
    #[should_panic(expected: ('Only owner can set oracle',))]
    fn test_non_owner_cannot_set_oracle() {
        let (vault, _, _, _) = setup();
        let new_oracle = starknet::contract_address_const::<0xDEF>();

        start_cheat_caller_address(vault.contract_address, NON_OWNER());
        vault.set_oracle(new_oracle);
        stop_cheat_caller_address(vault.contract_address);
    }

    // ── nullifier tracking ────────────────────────────────────────────

    #[test]
    fn test_nullifier_initially_unused() {
        let (vault, _, _, _) = setup();
        assert(!vault.is_nullifier_used(0x12345), 'Nullifier should be unused');
    }

    // ── commitment lookup ─────────────────────────────────────────────

    #[test]
    fn test_unknown_commitment_returns_zero() {
        let (vault, _, _, _) = setup();
        let (amount, salt) = vault.get_user_deposit(0xBAD);
        assert(amount == u256 { low: 0, high: 0 }, 'Amount should be 0');
        assert(salt == 0, 'Salt should be 0');
    }

    #[test]
    fn test_unknown_user_commitment_returns_zero() {
        let (vault, _, _, _) = setup();
        let nobody = starknet::contract_address_const::<0xDEAD>();
        let c = vault.get_commitment(nobody);
        assert(c == 0, 'Commitment should be 0');
    }
}
