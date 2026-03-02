use starknet::ContractAddress;
use core::array::SpanTrait;
use core::array::ArrayTrait;
use core::integer::u256;

#[starknet::interface]
pub trait IVerifier<TContractState> {
    fn verify_proof(
        self: @TContractState,
        proof: Span<felt252>,
        merkle_root: felt252,
        borrow_amount_low: u128,
        borrow_amount_high: u128,
        btc_price: u128,
        usdc_price: u128,
        min_health_factor: u128,
        nullifier: felt252
    ) -> bool;
    
    fn verify_exit_proof(
        self: @TContractState,
        proof: Span<felt252>,
        commitment: felt252,
        btc_amount_low: u128,
        btc_amount_high: u128,
        merkle_root: felt252,
        health_factor_low: u128,
        health_factor_high: u128,
        nullifier: felt252
    ) -> bool;
}

#[starknet::contract]
pub mod Verifier {
    use super::{IVerifier, ContractAddress, ArrayTrait, SpanTrait, u256};
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::StoragePointerWriteAccess;

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
            proof: Span<felt252>,
            merkle_root: felt252,
            borrow_amount_low: u128,
            borrow_amount_high: u128,
            btc_price: u128,
            usdc_price: u128,
            min_health_factor: u128,
            nullifier: felt252
        ) -> bool {
            if proof.len() == 0 {
                return false;
            }

            if borrow_amount_low == 0 && borrow_amount_high == 0 {
                return false;
            }

            if merkle_root == 0 {
                return false;
            }
            
            if btc_price == 0 || usdc_price == 0 {
                return false;
            }
            
            if min_health_factor == 0 {
                return false;
            }
            
            if nullifier == 0 {
                return false;
            }

            let mut proof_array: Array<felt252> = ArrayTrait::new();
            let mut i: usize = 0;
            loop {
                if i >= proof.len() {
                    break;
                }
                proof_array.append(*proof.at(i));
                i += 1;
            };
            
            let hash = poseidon_hash_span(proof_array.span());
            if hash == 0 {
                return false;
            }

            true
        }
        
        fn verify_exit_proof(
            self: @ContractState,
            proof: Span<felt252>,
            commitment: felt252,
            btc_amount_low: u128,
            btc_amount_high: u128,
            merkle_root: felt252,
            health_factor_low: u128,
            health_factor_high: u128,
            nullifier: felt252
        ) -> bool {
            if proof.len() == 0 {
                return false;
            }

            if commitment == 0 {
                return false;
            }
            
            if btc_amount_low == 0 && btc_amount_high == 0 {
                return false;
            }

            if merkle_root == 0 {
                return false;
            }
            
            if health_factor_low < 150 {
                return false;
            }
            
            if nullifier == 0 {
                return false;
            }

            let mut proof_array: Array<felt252> = ArrayTrait::new();
            let mut i: usize = 0;
            loop {
                if i >= proof.len() {
                    break;
                }
                proof_array.append(*proof.at(i));
                i += 1;
            };
            
            let hash = poseidon_hash_span(proof_array.span());
            if hash == 0 {
                return false;
            }

            true
        }
    }
}
