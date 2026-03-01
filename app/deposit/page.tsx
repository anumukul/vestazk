'use client';

import { useState } from 'react';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [commitment, setCommitment] = useState('');

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      // Simulate deposit for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock commitment
      const mockCommitment = '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0');
      setCommitment(mockCommitment);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Deposit WBTC</h1>
      
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
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
