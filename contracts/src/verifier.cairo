use starknet::ContractAddress;
use core::array::SpanTrait;

/// Interface to the Garaga-generated UltraStarknetZKHonk verifier.
///
/// The real verifier contract is deployed from the `vestazk_verifier` Scarb package
/// located at: zk-badges/lending_proof/vestazk_verifier/
///
/// It performs full cryptographic verification including:
/// - Sumcheck protocol verification
/// - Gemini fold evaluation
/// - KZG pairing check (BN254)
/// - Grumpkin scalar multiplication
///
/// On success, returns Option::Some(public_inputs) where public_inputs
/// contains the circuit's public values as u256 elements:
///   [merkle_root, borrow_amount, btc_price, usdc_price, min_health_factor, nullifier]
///
/// On failure, returns Option::None (or execution reverts).

#[starknet::interface]
pub trait IUltraStarknetZKHonkVerifier<TContractState> {
    /// Verify a full UltraHonk ZK proof with hints.
    ///
    /// The `full_proof_with_hints` contains the serialized proof, MSM hints,
    /// and KZG pairing hints — generated via `garaga calldata`.
    ///
    /// Returns Some(public_inputs) if valid, None if invalid.
    fn verify_ultra_starknet_zk_honk_proof(
        self: @TContractState,
        full_proof_with_hints: Span<felt252>,
    ) -> Option<Span<u256>>;
}
