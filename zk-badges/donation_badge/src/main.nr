// src/main.nr
// Donation Badge Circuit
// Proves: "I donated at least `threshold` without revealing actual amount"

// Poseidon hashing from external library
use poseidon::poseidon::bn254::hash_2;

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

fn main(
    // PRIVATE INPUTS (known only to prover)
    donation_amount: u64,           // Actual donation amount (in smallest units, e.g., cents)
    donor_secret: Field,            // Secret tied to donor's identity
    
    // PUBLIC INPUTS (visible on-chain)
    threshold: pub u64,             // Minimum amount to prove (e.g., 10000 = $100.00)
    donation_commitment: pub Field, // Hash commitment binding donor to donation
    badge_tier: pub u8              // Badge tier (1=Bronze $10+, 2=Silver $100+, 3=Gold $1000+)
) {
    // 1. Verify donation meets threshold
    assert(donation_amount >= threshold, "Donation below threshold");
    
    // 2. Verify commitment matches (binds donor identity to this proof)
    // commitment = poseidon(donor_secret, donation_amount)
    let amount_field = u64_to_field(donation_amount);
    let computed_commitment = hash_2([donor_secret, amount_field]);
    assert(computed_commitment == donation_commitment, "Invalid commitment");
    
    // 3. Verify badge tier is correct for the amount
    // Tier 1: $10+   (1000 cents)
    // Tier 2: $100+  (10000 cents)
    // Tier 3: $1000+ (100000 cents)
    if badge_tier == 1 {
        assert(donation_amount >= 1000, "Below Bronze tier");
    } else if badge_tier == 2 {
        assert(donation_amount >= 10000, "Below Silver tier");
    } else if badge_tier == 3 {
        assert(donation_amount >= 100000, "Below Gold tier");
    } else {
        assert(false, "Invalid badge tier");
    }
}

// Test the circuit
#[test]
fn test_valid_silver_badge() {
    let amount: u64 = 15000;  // $150 donation
    let secret: Field = 12345;
    let amount_field = u64_to_field(amount);
    let commitment = hash_2([secret, amount_field]);
    
    main(
        amount,           // private: actual amount
        secret,           // private: donor secret
        10000,            // public: threshold ($100)
        commitment,       // public: commitment
        2                 // public: Silver tier
    );
}

#[test]
fn test_valid_gold_badge() {
    let amount: u64 = 500000; // $5000 donation
    let secret: Field = 99999;
    let amount_field = u64_to_field(amount);
    let commitment = hash_2([secret, amount_field]);
    
    main(
        amount,
        secret,
        100000,           // threshold: $1000
        commitment,
        3                 // Gold tier
    );
}

