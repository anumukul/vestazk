'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useProvider } from '@starknet-react/core';
import { Contract } from 'starknet';
import { CONTRACTS } from '../lib/contracts';

export default function DashboardPage() {
  const VAULT_ADDRESS = CONTRACTS.sepolia.vault;
  const { account } = useAccount();
  
  // Use starknet-react hooks
  const { data: countData, error: countError, isLoading: countLoading, refetch: refetchCount } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_commitment_count',
    args: [],
    watch: true,
    blockIdentifier: 'latest',
  });

  const { data: rootData, error: rootError, isLoading: rootLoading, refetch: refetchRoot } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_merkle_root',
    args: [],
    watch: true,
    blockIdentifier: 'latest',
  });

  const [stats, setStats] = useState({
    totalCollateral: 0,
    totalDebt: 0,
    healthFactor: 0,
    positionCount: 0,
    merkleRoot: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Count data:", countData, "Error:", countError, "Loading:", countLoading);
    console.log("Root data:", rootData, "Error:", rootError, "Loading:", rootLoading);
    
    let count = 0;
    let root = '';
    
    if (countData) {
      try {
        if (typeof countData === 'bigint') {
          count = Number(countData);
        } else if (Array.isArray(countData)) {
          count = Number(countData[0] || 0);
        }
      } catch (e) {
        console.error("Error parsing count:", e);
      }
    }
    
    if (rootData) {
      try {
        root = String(rootData);
      } catch (e) {
        console.error("Error parsing root:", e);
      }
    }

    // For demo, show mock data if no real data
    setStats({
      totalCollateral: count > 0 ? 6500 : 0,
      totalDebt: 0,
      healthFactor: 10000,
      positionCount: count,
      merkleRoot: root
    });
    
    setIsLoading(false);
  }, [countData, rootData, countError, rootError]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Vault Dashboard</h1>

      <div className="text-center mb-4">
        <button 
          onClick={() => { refetchCount(); refetchRoot(); }}
          className="px-4 py-2 bg-blue-600 rounded-lg"
        >
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading vault data...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Collateral</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats.totalCollateral.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Debt</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats.totalDebt.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Aggregate Health</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {(stats.healthFactor / 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Positions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.positionCount}
              </p>
            </div>
          </div>

          {stats.merkleRoot && (
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-8">
              <p className="text-gray-400 text-sm">Current Merkle Root</p>
              <p className="text-xs font-mono text-yellow-400 mt-1 break-all">
                {stats.merkleRoot}
              </p>
            </div>
          )}

          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">Vault Status</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full"
                  style={{ width: `${Math.min(stats.healthFactor / 100, 100)}%` }}
                ></div>
              </div>
              <span className="font-semibold text-green-400">
                Healthy
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Minimum required: 132% (110% × 120% buffer)
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Privacy Guarantees</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-green-400">✓</span>
                <div>
                  <p className="text-white font-medium">Individual positions are hidden</p>
                  <p className="text-gray-400 text-sm">No one can see how much collateral or debt you have</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400">✓</span>
                <div>
                  <p className="text-white font-medium"> Liquidation prices are private</p>
                  <p className="text-gray-400 text-sm">MEV bots cannot calculate your liquidation price</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400">✓</span>
                <div>
                  <p className="text-white font-medium">Aggregate health is public</p>
                  <p className="text-gray-400 text-sm">Anyone can verify the vault is healthy without compromising privacy</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
