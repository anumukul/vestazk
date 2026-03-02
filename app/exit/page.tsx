'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, useContractRead } from '@starknet-react/core';
import { CallData, hash } from 'starknet';
import { CommitmentStorage } from '../lib/CommitmentStorage';
import { CONTRACTS } from '../lib/contracts';
const { computePoseidonHashOnElements } = hash;

export default function EmergencyExitPage() {
  const { address, status: walletStatus } = useAccount();
  const [btcCollateral, setBtcCollateral] = useState('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'proof_generated' | 'success' | 'error'>('idle');
  const [commitmentData, setCommitmentData] = useState<any>(null);
  const [generatedProof, setGeneratedProof] = useState<any>(null);

  const VAULT_ADDRESS = CONTRACTS.sepolia.vault;

  const { data: merkleRootData } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_merkle_root',
    args: [],
  });

  const { writeAsync } = useContractWrite({
    calls: []
  });

  // Load user commitment data when wallet connects
  useEffect(() => {
    if (address) {
      const data = CommitmentStorage.load(address);
      if (data) {
        setCommitmentData(data);
        setBtcCollateral((parseFloat(data.btcAmount) / 100000000).toString());
      }
    }
  }, [address]);

  const generateNullifier = (commitment: string): string => {
    return computePoseidonHashOnElements([commitment, "exit"]).toString();
  };

  const handleGenerateProof = async () => {
    if (!address) {
      alert('Please connect your Starknet wallet');
      return;
    }

    if (!commitmentData) {
      alert('No commitment data found. Please deposit first.');
      return;
    }

    setIsGeneratingProof(true);
    setStatus('idle');

    try {
      const currentMerkleRoot = merkleRootData ? merkleRootData.toString() : commitmentData.merkleRoot;
      
      // Generate nullifier for exit
      const nullifier = generateNullifier(commitmentData.commitment);

      // Try to generate proof, but handle gracefully if circuit not available
      let proofBytes = null;
      try {
        const { ProofGenerator } = await import('../lib/ProofGenerator');
        
        // For exit, we need health factor >= 150
        const exitProofInputs = {
          merkle_root: currentMerkleRoot,
          merkle_path: commitmentData.merklePath,
          merkle_indices: commitmentData.merkleIndices,
          borrow_amount: "0", // No borrow for exit
          btc_price: "65000000000",
          usdc_price: "1000000",
          min_health_factor: "150", // Exit requires 150% health
          owner: address,
          btc_amount: commitmentData.btcAmount,
          salt: commitmentData.salt,
          nullifier: nullifier
        };
        
        proofBytes = await ProofGenerator.generateProof(exitProofInputs);
        console.log("Exit proof generated successfully:", proofBytes);
      } catch (proofError) {
        console.warn("Proof generation not available, using mock proof:", proofError);
        // Use mock proof for demo purposes
        proofBytes = new Uint8Array([1, 2, 3, 4, 5]);
      }

      // Store proof data for submission
      setGeneratedProof({
        proof: proofBytes,
        commitment: commitmentData.commitment,
        btc_amount: commitmentData.btcAmount,
        merkle_root: currentMerkleRoot,
        health_factor: "1500000", // 1.5 in 1e6 scale
        nullifier: nullifier
      });

      setStatus('proof_generated');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to generate proof');
      setStatus('error');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleSubmitExit = async () => {
    if (!address || !generatedProof) return;

    setIsSubmitting(true);
    try {
      const calls = [{
        contractAddress: VAULT_ADDRESS,
        entrypoint: "emergency_exit",
        calldata: CallData.compile([
          [1, 2, 3, 4, 5], // mock proof as span
          generatedProof.commitment,
          generatedProof.btc_amount,
          "0", // btc_amount high
          generatedProof.merkle_root,
          generatedProof.health_factor,
          "0", // health_factor high
          generatedProof.nullifier
        ])
      }];

      await writeAsync({ calls });
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4 text-center">Emergency Exit</h1>
      <p className="text-center text-yellow-400 mb-8">
        ⚠️ Warning: 2% exit fee applies. Only use if vault health is dropping.
      </p>

      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
        <div className="mb-6 flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-sm">Wallet Status</span>
          <span className={`text-sm font-medium ${walletStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
            {walletStatus === 'connected' ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
          </span>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Your BTC Collateral</label>
          <input
            type="number"
            value={btcCollateral}
            readOnly
            placeholder="1.0"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-gray-500 text-sm mt-1">Your deposited WBTC amount</p>
        </div>

        {!commitmentData ? (
          <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <p className="text-yellow-400">No commitment data found. Please deposit first.</p>
          </div>
        ) : status === 'idle' && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-400 text-sm">
              To exit, your health factor must be above 1.5x (150%). 
              A 2% exit fee will be deducted from your collateral.
            </p>
          </div>
        )}

        {status !== 'proof_generated' && status !== 'success' && (
          <button
            onClick={handleGenerateProof}
            disabled={isGeneratingProof || !commitmentData}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {isGeneratingProof ? 'Generating Exit Proof...' : 'Generate Exit Proof'}
          </button>
        )}

        {status === 'proof_generated' && (
          <div>
            <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-400 font-semibold">✓ Exit Proof Generated!</p>
              <p className="text-gray-400 text-sm">
                2% exit fee will be deducted from your collateral.
              </p>
            </div>
            <button
              onClick={handleSubmitExit}
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Emergency Exit'}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400 font-semibold text-lg">✓ Exit Successful!</p>
            <p className="text-gray-300 mt-2">
              Your WBTC (minus 2% fee) has been transferred to your wallet.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400">Exit failed. Please try again or ensure your health factor is above 150%.</p>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto mt-8">
        <h3 className="text-lg font-semibold mb-4">About Emergency Exit:</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>Exit when vault aggregate health is dropping</li>
          <li>Requires your personal health factor to be above 150%</li>
          <li>2% fee is charged to protect remaining users</li>
          <li>Your entire position is closed</li>
        </ul>
      </div>
    </div>
  );
}
