'use client';

import { useState } from 'react';
import { useAccount, useContractWrite, useContractRead } from '@starknet-react/core';
import { CommitmentStorage } from '../lib/CommitmentStorage';
import { CallData, hash } from 'starknet';
import { CONTRACTS } from '../lib/contracts';
const { computePoseidonHashOnElements } = hash;

export default function DepositPage() {
  const { address, status: walletStatus } = useAccount();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [commitment, setCommitment] = useState('');
  const [merkleRoot, setMerkleRoot] = useState('');

  const VAULT_ADDRESS = CONTRACTS.sepolia.vault;
  const WBTC_ADDRESS = CONTRACTS.sepolia.wbtc;

  const { writeAsync } = useContractWrite({
    calls: []
  });

  const { data: merkleRootData } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_merkle_root',
    args: [],
  });

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!address) {
      alert('Please connect your Starknet wallet first.');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      const amountParsed = Math.floor(parseFloat(amount) * 100000000); // Assuming 8 decimals for WBTC

      // First approve WBTC transfer
      const approveCalls = [
        {
          contractAddress: WBTC_ADDRESS,
          entrypoint: "approve",
          calldata: CallData.compile([
            VAULT_ADDRESS,
            amountParsed.toString(),
            "0"
          ])
        }
      ];

      await writeAsync({ calls: approveCalls });

      // Small delay to let approval settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Execute the deposit smart contract call
      const depositCalls = [
        {
          contractAddress: VAULT_ADDRESS,
          entrypoint: "deposit",
          calldata: CallData.compile([amountParsed.toString(), "0"]) // u256 expects low, high
        }
      ];

      await writeAsync({ calls: depositCalls });

      // Generate actual commitment parameters
      const salt = "0x" + Math.random().toString(16).slice(2, 66).padEnd(64, '0');

      // Compute Poseidon(owner, amount, salt)
      const computedCommitment = computePoseidonHashOnElements([
        address,
        amountParsed.toString(),
        salt
      ]);

      // Get current merkle root (use default if not available)
      const currentMerkleRoot = merkleRootData ? merkleRootData.toString() : "0x0";

      // Save locally
      CommitmentStorage.save(address, {
        commitment: computedCommitment.toString(),
        btcAmount: amountParsed.toString(),
        salt: salt,
        merkleRoot: currentMerkleRoot,
        merklePath: Array(20).fill("0x0"),
        merkleIndices: Array(20).fill(0),
        timestamp: Date.now()
      });

      setCommitment(computedCommitment.toString());
      setMerkleRoot(currentMerkleRoot);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!address) return;
    
    const data = CommitmentStorage.export(address);
    if (!data) {
      alert('No commitment data to export');
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vestazk-commitment-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Deposit WBTC</h1>

      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
        <div className="mb-6 flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-sm">Wallet Status</span>
          <span className={`text-sm font-medium ${walletStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
            {walletStatus === 'connected' ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
          </span>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Amount (WBTC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleDeposit}
          disabled={isLoading}
          className="w-full py-3 bg-primary rounded-lg font-semibold hover:bg-primary/80 transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Deposit & Generate Commitment'}
        </button>

        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400 font-semibold mb-2">✓ Deposit Successful!</p>
            <p className="text-gray-300 text-sm mb-2">Your Commitment:</p>
            <code className="block bg-gray-900 p-2 rounded text-xs break-all">
              {commitment}
            </code>
            <p className="text-yellow-400 text-sm mt-4">
              ⚠️ Save this commitment! If you lose it, you cannot withdraw your funds.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Download Backup
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400">Deposit failed. Please try again.</p>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto mt-8">
        <h3 className="text-lg font-semibold mb-4">How it works:</h3>
        <ol className="list-decimal list-inside text-gray-400 space-y-2">
          <li>Enter the amount of WBTC you want to deposit</li>
          <li>Click deposit to transfer WBTC to the vault</li>
          <li>A unique commitment is generated using Poseidon hash</li>
          <li>Save your commitment - it&apos;s used to prove ownership later</li>
          <li>The vault aggregates your deposit with others</li>
        </ol>
      </div>
    </div>
  );
}
