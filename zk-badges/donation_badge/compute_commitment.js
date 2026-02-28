// compute_commitment.js
// Run with: node compute_commitment.js

import { buildPoseidon } from 'circomlibjs';

async function computeCommitment(donorSecret, donationAmount) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    
    const hash = poseidon([
        BigInt(donorSecret),
        BigInt(donationAmount)
    ]);
    
    console.log('Commitment:', F.toString(hash));
    return F.toString(hash);
}

// Example: $150 donation with secret 123456789
computeCommitment('123456789', '15000').catch(console.error);

