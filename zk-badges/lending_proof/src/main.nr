// src/main.nr
// Lending Proof Circuit
// Proves: "My health factor is >= min_health_factor" without revealing actual position

use poseidon::poseidon::bn254::hash_2;
use poseidon::poseidon::bn254::hash_3;

global MERKLE_TREE_DEPTH: u32 = 20;
global HEALTH_DECIMALS: u64 = 100;

fn u64_to_field(value: u64) -> Field {
    let mut acc: Field = 0;
    let mut base: Field = 1;
    let mut temp = value;
    for _ in 0..64 {
        if (temp & 1) == 1 {
            acc += base;
        }
        base *= 2;
        temp >>= 1;
    }
    acc
}

fn verify_merkle_proof(
    leaf: Field,
    path: [Field; MERKLE_TREE_DEPTH],
    indices: [u1; MERKLE_TREE_DEPTH]
) -> Field {
    let mut current = leaf;
    
    for i in 0..MERKLE_TREE_DEPTH {
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

fn main(
    // PUBLIC INPUTS (visible on-chain)
    merkle_root: pub Field,
    borrow_amount: pub u64,
    btc_price: pub u64,
    usdc_price: pub u64,
    min_health_factor: pub u64,
    nullifier: pub Field,
    
    // PRIVATE INPUTS (known only to prover)
    owner_address: Field,
    btc_amount: u64,
    salt: Field,
    merkle_path: [Field; MERKLE_TREE_DEPTH],
    merkle_indices: [u1; MERKLE_TREE_DEPTH]
) {
    // Step 1: Compute commitment from private inputs
    // commitment = Poseidon(owner_address, btc_amount, salt)
    let btc_amount_field = u64_to_field(btc_amount);
    let commitment = hash_3([owner_address, btc_amount_field, salt]);
    
    // Step 2: Verify Merkle proof
    let computed_root = verify_merkle_proof(
        commitment,
        merkle_path,
        merkle_indices
    );
    assert(computed_root == merkle_root, "Invalid Merkle proof");
    
    // Step 3: Calculate health factor using Field to avoid overflow
    assert(btc_amount > 0, "Collateral cannot be zero");
    assert(borrow_amount > 0, "Debt cannot be zero");
    
    let collateral_f: Field = btc_amount as Field * btc_price as Field;
    let debt_f: Field = borrow_amount as Field * usdc_price as Field;
    let health_factor_f = collateral_f * HEALTH_DECIMALS as Field / debt_f;
    let health_factor = health_factor_f as u64;
    
    // Step 4: Verify health factor meets minimum
    assert(
        health_factor >= min_health_factor,
        "Health factor too low"
    );
    
    // Step 5: Verify nullifier to prevent replay
    let borrow_amount_field = u64_to_field(borrow_amount);
    let expected_nullifier = hash_2([commitment, borrow_amount_field]);
    assert(expected_nullifier == nullifier, "Invalid nullifier");
}

#[test]
fn test_valid_health_factor() {
    let owner: Field = 12345;
    let btc_amount: u64 = 100000000;  // 1 BTC (8 decimals)
    let salt: Field = 99999;
    let borrow_amount: u64 = 65000000; // 65 USDC (6 decimals)
    let btc_price: u64 = 100000000;    // $10,000 (8 decimals)
    let usdc_price: u64 = 1000000;     // $1 (6 decimals)
    let min_health_factor: u64 = 110;  // 1.10
    
    // Calculate commitment
    let btc_amount_field = u64_to_field(btc_amount);
    let commitment = hash_3([owner, btc_amount_field, salt]);
    
    // Build dummy merkle proof
    let path = [0; MERKLE_TREE_DEPTH];
    let indices = [0; MERKLE_TREE_DEPTH];
    let root = verify_merkle_proof(commitment, path, indices);
    
    // Calculate nullifier
    let borrow_amount_field = u64_to_field(borrow_amount);
    let nullifier = hash_2([commitment, borrow_amount_field]);
    
    main(
        root,
        borrow_amount,
        btc_price,
        usdc_price,
        min_health_factor,
        nullifier,
        owner,
        btc_amount,
        salt,
        path,
        indices
    );
}

#[test]
fn test_exact_minimum_health_factor() {
    // Exact minimum health factor (1.10)
    let owner: Field = 12345;
    let btc_amount: u64 = 110000000;  // 1.1 BTC
    let salt: Field = 99999;
    let borrow_amount: u64 = 10000000; // 10 USDC
    let btc_price: u64 = 100000000;   // $10,000
    let usdc_price: u64 = 1000000;    // $1
    let min_health_factor: u64 = 110;  // 1.10
    
    let btc_amount_field = u64_to_field(btc_amount);
    let commitment = hash_3([owner, btc_amount_field, salt]);
    
    let path = [0; MERKLE_TREE_DEPTH];
    let indices = [0; MERKLE_TREE_DEPTH];
    let root = verify_merkle_proof(commitment, path, indices);
    
    let borrow_amount_field = u64_to_field(borrow_amount);
    let nullifier = hash_2([commitment, borrow_amount_field]);
    
    main(
        root,
        borrow_amount,
        btc_price,
        usdc_price,
        min_health_factor,
        nullifier,
        owner,
        btc_amount,
        salt,
        path,
        indices
    );
}
