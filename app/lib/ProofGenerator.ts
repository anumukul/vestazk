import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';

// Circuit JSON compiled from lending_proof.nr via `nargo compile`
import circuit from './lending_proof.json';

export interface ProofInputs {
    merkle_root: string;
    merkle_path: string[];
    merkle_indices: number[];
    borrow_amount: string;
    btc_price: string;
    usdc_price: string;
    min_health_factor: string;
    owner: string;
    btc_amount: string;
    salt: string;
    nullifier: string;
}

export class ProofGenerator {
    /**
     * Generate a ZK proof for a borrow operation.
     *
     * Uses the UltraHonk proving system (matching the Garaga verifier on-chain).
     * Proof generation runs client-side and takes 30-60 seconds.
     *
     * @throws Error if proof generation fails — callers should handle this
     *         and show a user-facing error message.
     */
    static async generateProof(inputs: ProofInputs): Promise<Uint8Array> {
        console.log("[ProofGenerator] Initializing UltraHonk backend...");

        // @ts-ignore - circuit JSON typing may not match perfectly
        const backend = new UltraHonkBackend(circuit);

        // @ts-ignore
        const noir = new Noir(circuit, backend);

        // Format inputs to match the Noir circuit's parameter names exactly:
        //   main(merkle_root, borrow_amount, btc_price, usdc_price, min_health_factor, nullifier,
        //        owner_address, btc_amount, salt, merkle_path, merkle_indices)
        const circuitInputs = {
            merkle_root: inputs.merkle_root,
            borrow_amount: inputs.borrow_amount,
            btc_price: inputs.btc_price,
            usdc_price: inputs.usdc_price,
            min_health_factor: inputs.min_health_factor,
            nullifier: inputs.nullifier,
            owner_address: inputs.owner,
            btc_amount: inputs.btc_amount,
            salt: inputs.salt,
            merkle_path: inputs.merkle_path,
            merkle_indices: inputs.merkle_indices,
        };

        console.log("[ProofGenerator] Generating witness and proof (this may take 30-60s)...");

        try {
            // @ts-ignore
            const { witness } = await noir.execute(circuitInputs);
            const proof = await backend.generateProof(witness);

            console.log("[ProofGenerator] Proof generated successfully!");
            console.log(`[ProofGenerator] Proof size: ${proof.proof.length} bytes`);

            return proof.proof;
        } catch (error) {
            console.error("[ProofGenerator] Proof generation failed:", error);
            throw error; // Let caller decide how to handle failure
        }
    }
}
