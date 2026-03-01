use starknet::ContractAddress;
use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess};

#[starknet::interface]
pub trait IVerifier<TContractState> {
    fn verify_proof(
        self: @TContractState,
        proof_len: usize,
        merkle_root: felt252,
        borrow_amount_low: u64,
        borrow_amount_high: u64,
        btc_price: u64,
        usdc_price: u64,
        min_health_factor: u64,
        nullifier: felt252
    ) -> bool;
}

#[starknet::contract]
pub mod Verifier {
    use super::{IVerifier, ContractAddress, StoragePointerWriteAccess, StoragePointerReadAccess};

    #[storage]
    struct Storage {
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl VerifierImpl of IVerifier<ContractState> {
        fn verify_proof(
            self: @ContractState,
            proof_len: usize,
            merkle_root: felt252,
            borrow_amount_low: u64,
            borrow_amount_high: u64,
            btc_price: u64,
            usdc_price: u64,
            min_health_factor: u64,
            nullifier: felt252
        ) -> bool {
            if proof_len == 0 {
                return false;
            }

            if borrow_amount_low == 0 && borrow_amount_high == 0 {
                return false;
            }

            if merkle_root == 0 {
                return false;
            }

            true
        }
    }
}
