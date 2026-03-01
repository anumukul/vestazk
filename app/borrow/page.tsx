'use client';

import { useState, useEffect } from 'react';

export default function BorrowPage() {
  const [borrowAmount, setBorrowAmount] = useState('');
  const [btcCollateral, setBtcCollateral] = useState('');
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'proof_generated' | 'success' | 'error'>('idle');
  const [healthFactor, setHealthFactor] = useState<number | null>(null);

  const btcPrice = 65000;
  const usdcPrice = 1;
  const minHealthFactor = 1.1;

  useEffect(() => {
    if (borrowAmount && btcCollateral) {
      const collateralUSD = parseFloat(btcCollateral) * btcPrice;
      const debtUSD = parseFloat(borrowAmount) * usdcPrice;
      if (debtUSD > 0) {
        const health = collateralUSD / debtUSD;
        setHealthFactor(health);
      }
    } else {
      setHealthFactor(null);
    }
  }, [borrowAmount, btcCollateral]);

  const handleGenerateProof = async () => {
    if (!borrowAmount || !btcCollateral) {
      alert('Please enter both collateral and borrow amount');
      return;
    }

    if (healthFactor !== null && healthFactor < minHealthFactor) {
      alert(`Health factor too low. Minimum required: ${minHealthFactor}`);
      return;
    }

    setIsGeneratingProof(true);
    setStatus('idle');

    try {
      // Simulate proof generation (30-60 seconds in real scenario)
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStatus('proof_generated');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleSubmitBorrow = async () => {
    setIsSubmitting(true);
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      <h1 className="text-3xl font-bold mb-8 text-center">Borrow USDC</h1>
      
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Your BTC Collateral</label>
          <input
            type="number"
            value={btcCollateral}
            onChange={(e) => setBtcCollateral(e.target.value)}
            placeholder="1.0"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          <p className="text-gray-500 text-sm mt-1">Your deposited WBTC amount (from commitment)</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Borrow Amount (USDC)</label>
          <input
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="50000"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        {healthFactor !== null && (
          <div className={`mb-6 p-4 rounded-lg border ${
            healthFactor >= 1.5 ? 'bg-green-900/30 border-green-700' :
            healthFactor >= 1.2 ? 'bg-yellow-900/30 border-yellow-700' :
            'bg-red-900/30 border-red-700'
          }`}>
            <p className="text-gray-300">Health Factor:</p>
            <p className={`text-2xl font-bold ${
              healthFactor >= 1.5 ? 'text-green-400' :
              healthFactor >= 1.2 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {healthFactor.toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {healthFactor >= minHealthFactor ? '✓ Sufficient collateral' : `✗ Below minimum (${minHealthFactor})`}
            </p>
          </div>
        )}

        {status !== 'proof_generated' && status !== 'success' && (
          <button
            onClick={handleGenerateProof}
            disabled={isGeneratingProof}
            className="w-full py-3 bg-primary rounded-lg font-semibold hover:bg-primary/80 transition disabled:opacity-50"
          >
            {isGeneratingProof ? 'Generating Proof...' : 'Generate ZK Proof'}
          </button>
        )}

        {status === 'proof_generated' && (
          <div>
            <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-400 font-semibold">✓ Proof Generated!</p>
              <p className="text-gray-400 text-sm">Your ZK proof is ready to submit.</p>
            </div>
            <button
              onClick={handleSubmitBorrow}
              disabled={isSubmitting}
              className="w-full py-3 bg-secondary text-gray-900 rounded-lg font-semibold hover:bg-secondary/80 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Borrow Transaction'}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-green-400 font-semibold text-lg">✓ Borrow Successful!</p>
            <p className="text-gray-300 mt-2">
              {borrowAmount} USDC has been transferred to your wallet.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400">Transaction failed. Please try again.</p>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto mt-8">
        <h3 className="text-lg font-semibold mb-4">How borrowing works:</h3>
        <ol className="list-decimal list-inside text-gray-400 space-y-2">
          <li>Enter your BTC collateral amount (from your commitment)</li>
          <li>Enter how much USDC you want to borrow</li>
          <li>Review your health factor - must be above {minHealthFactor}</li>
          <li>Generate a ZK proof (30-60 seconds)</li>
          <li>The proof verifies your health without revealing actual numbers</li>
          <li>Submit the transaction - USDC is sent to your wallet</li>
        </ol>
      </div>
    </div>
  );
}
