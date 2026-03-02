// Test suite for VesuVault

#[cfg(test)]
mod tests {
    use snforge_std::{declare, ContractClassTrait, start_prank, stop_prank, CheatTarget};
    use starknet::ContractAddress;
    use core::traits::Into;
    use vesu_vault::vesu_vault::{IVesuVaultDispatcher, IVesuVaultDispatcherTrait, BorrowPublicInputs};
    use vesu_vault::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

    // Mock deployment helper
    fn setup() -> (IVesuVaultDispatcher, ContractAddress, ContractAddress, ContractAddress) {
        // We'll mock the ERC20s and dispatchers
        let vault_class = declare("vesu_vault").unwrap();
        
        // Use dummy addresses for dependencies
        let wbtc = starknet::contract_address_const::<0x111>();
        let usdc = starknet::contract_address_const::<0x222>();
        let vesu_pool = starknet::contract_address_const::<0x333>();
        let verifier = starknet::contract_address_const::<0x444>();
        let oracle = starknet::contract_address_const::<0x555>();
        let min_health_factor = 110_u256;
        let buffer_percentage = 120_u256;
        let owner = starknet::contract_address_const::<0x666>();

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

        let (vault_address, _) = vault_class.deploy(@calldata).unwrap();
        
        (IVesuVaultDispatcher { contract_address: vault_address }, wbtc, usdc, owner)
    }

    #[test]
    fn test_vault_initialization() {
        let (vault, _, _, _) = setup();
        
        // Check initial empty merkle root is a calculated zero-hash, not strictly '0' anymore based on depth 20
        let initial_root = vault.get_merkle_root();
        assert(initial_root != 0, 'Initial root should be filled');
        assert(vault.get_commitment_count() == 0, 'Count should be 0');
    }
}
