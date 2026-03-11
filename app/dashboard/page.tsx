'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from '@starknet-react/core';
import { hash } from 'starknet';
import { CONTRACTS, RPC_URL, MIN_HEALTH_FACTOR, BUFFER_PERCENTAGE } from '../lib/contracts';
import { HealthFactorBar } from '../components/HealthFactorDisplay';

export default function DashboardPage() {
  const VAULT_ADDRESS = CONTRACTS.sepolia.vault;
  const { account } = useAccount();

  const { data: countData, error: countError, isLoading: countLoading, refetch: refetchCount } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_commitment_count',
    args: [],
    watch: true,
  });

  const { data: rootData, error: rootError, isLoading: rootLoading, refetch: refetchRoot } = useContractRead({
    address: VAULT_ADDRESS,
    functionName: 'get_merkle_root',
    args: [],
    watch: true,
  });

  const [stats, setStats] = useState({
    totalCollateralUsd: '0',
    totalDebtUsd: '0',
    healthFactor: 0,
    positionCount: 0,
    merkleRoot: '',
    totalDepositedRaw: '0',
    totalBorrowedRaw: '0',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch aggregate health factor and totals via direct RPC
  useEffect(() => {
    async function fetchAggregateData() {
      try {
        // Fetch total deposited
        const depositedRes = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1,
            method: 'starknet_call',
            params: [{
              contract_address: VAULT_ADDRESS,
              entry_point_selector: hash.getSelectorFromName('get_total_deposited'),
              calldata: []
            }, 'latest']
          })
        });

        // Fetch total borrowed
        const borrowedRes = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 2,
            method: 'starknet_call',
            params: [{
              contract_address: VAULT_ADDRESS,
              entry_point_selector: hash.getSelectorFromName('get_total_borrowed'),
              calldata: []
            }, 'latest']
          })
        });

        const depositedData = await depositedRes.json();
        const borrowedData = await borrowedRes.json();

        let totalDeposited = BigInt(0);
        let totalBorrowed = BigInt(0);

        if (depositedData.result && depositedData.result.length >= 2) {
          totalDeposited = BigInt(depositedData.result[0]) + (BigInt(depositedData.result[1]) << BigInt(128));
        }
        if (borrowedData.result && borrowedData.result.length >= 2) {
          totalBorrowed = BigInt(borrowedData.result[0]) + (BigInt(borrowedData.result[1]) << BigInt(128));
        }

        // Fetch aggregate health factor directly
        const healthRes = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 3,
            method: 'starknet_call',
            params: [{
              contract_address: VAULT_ADDRESS,
              entry_point_selector: hash.getSelectorFromName('get_aggregate_health_factor'),
              calldata: []
            }, 'latest']
          })
        });

        const healthData = await healthRes.json();
        let collateralUsdVal = BigInt(0);
        let debtUsdVal = BigInt(0);
        let hfVal = 0;

        if (healthData.result && healthData.result.length >= 6) {
          // get_aggregate_health_factor returns (u256 collateral, u256 debt, u256 health)
          // each u256 is 2 felts
          collateralUsdVal = BigInt(healthData.result[0]) + (BigInt(healthData.result[1]) << BigInt(128));
          debtUsdVal = BigInt(healthData.result[2]) + (BigInt(healthData.result[3]) << BigInt(128));
          const hfBig = BigInt(healthData.result[4]) + (BigInt(healthData.result[5]) << BigInt(128));
          hfVal = Number(hfBig) / 1000000;
        }

        setStats({
          totalCollateralUsd: (Number(collateralUsdVal) / 1e8).toString(),
          totalDebtUsd: (Number(debtUsdVal) / 1e8).toString(),
          healthFactor: hfVal === 0 && collateralUsdVal > 0 ? Infinity : hfVal,
          positionCount: countData ? Number(countData) : 0,
          merkleRoot: rootData ? String(rootData) : '',
          totalDepositedRaw: totalDeposited.toString(),
          totalBorrowedRaw: totalBorrowed.toString(),
        });
      } catch (e) {
        console.error("Failed to fetch aggregate data:", e);

        // Fallback: use starknet-react hook data
        let count = 0;
        let root = '';
        if (countData) {
          count = typeof countData === 'bigint' ? Number(countData) : Number((countData as any)[0] || 0);
        }
        if (rootData) {
          root = String(rootData);
        }
        setStats({
          totalCollateralUsd: '0',
          totalDebtUsd: '0',
          healthFactor: 0,
          positionCount: count,
          merkleRoot: root,
          totalDepositedRaw: '0',
          totalBorrowedRaw: '0',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAggregateData();
  }, [countData, rootData, VAULT_ADDRESS]);

  const minRequired = (MIN_HEALTH_FACTOR / 100) * (BUFFER_PERCENTAGE / 100);
  const collateralDisplay = Number(stats.totalCollateralUsd).toLocaleString();
  const debtDisplay = Number(stats.totalDebtUsd).toLocaleString();

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Vault Dashboard</h1>

      <div className="text-center mb-4">
        <button
          onClick={() => { refetchCount(); refetchRoot(); setIsLoading(true); }}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
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
                ${collateralDisplay}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(Number(stats.totalDepositedRaw) / 1e8).toFixed(4)} BTC
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Debt</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${debtDisplay}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(Number(stats.totalBorrowedRaw) / 1e6).toFixed(2)} USDC
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Aggregate Health</p>
              <p className={`text-2xl font-bold mt-1 ${stats.healthFactor === Infinity || stats.healthFactor >= 1.5
                ? 'text-green-400'
                : stats.healthFactor >= 1.2
                  ? 'text-yellow-400'
                  : stats.healthFactor > 0
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}>
                {stats.healthFactor === Infinity
                  ? '∞ (No Debt)'
                  : stats.healthFactor > 0
                    ? `${(stats.healthFactor * 100).toFixed(0)}%`
                    : 'N/A'}
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
            {stats.healthFactor > 0 ? (
              <HealthFactorBar
                health={stats.healthFactor === Infinity ? 3 : stats.healthFactor}
                minRequired={minRequired}
              />
            ) : (
              <p className="text-gray-400">No active positions yet.</p>
            )}
            <p className="text-gray-400 text-sm mt-4">
              Minimum required: {(minRequired * 100).toFixed(0)}% ({MIN_HEALTH_FACTOR}% × {BUFFER_PERCENTAGE}% buffer)
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Privacy Guarantees</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✓</span>
                  <p className="font-medium text-white">Hidden Positions</p>
                </div>
                <p className="text-gray-400 text-sm">No one can see how much BTC you deposited or USDC you borrowed.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✓</span>
                  <p className="font-medium text-white">Private Liquidation</p>
                </div>
                <p className="text-gray-400 text-sm">Target prices are concealed. MEV bots cannot front-run your liquidation.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-green-400">
                  <span>✓</span>
                  <p className="font-medium text-white">Public Solvency</p>
                </div>
                <p className="text-gray-400 text-sm">Aggregate health allows the pool to verify solvency without revealing users.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
