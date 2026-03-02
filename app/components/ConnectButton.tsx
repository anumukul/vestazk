'use client';

import { useState } from 'react';
import { useAccount, useConnect } from '@starknet-react/core';

export function ConnectButton() {
  const { address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'connected' && address) {
    return (
      <button
        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg font-medium transition"
      >
        Connect Wallet
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {connectors.map((connector, index) => (
            <button
              key={index}
              onClick={() => {
                connect({ connector });
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center space-x-2"
            >
              <span className="text-lg">🦊</span>
              <span>Wallet {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
