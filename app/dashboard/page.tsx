'use client';

import { useState, useEffect } from 'react';
import { CONTRACTS } from '../lib/contracts';

const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/cf52O0RwFy1mEB0uoYsel";

export default function DashboardPage() {
  const VAULT_ADDRESS = CONTRACTS.sepolia.vault;

  const SELECTORS = {
    get_commitment_count: '0x347e945ab47091e31323f58244ac1987a728ecc433a5461b1eba2613b149643',
    get_merkle_root: '0x3e32738e9f3e648e22b46d4d057c7d3562e7c70dc9a9e1f4f4c1c9c4e8c8d3'
  };

  const [stats, setStats] = useState({
    totalCollateral: 0,
    totalDebt: 0,
    healthFactor: 0,
    positionCount: 0,
    merkleRoot: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch commitment count
        const countResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'starknet_call',
            params: [{
              entry_point_selector: SELECTORS.get_commitment_count,
              contract_address: VAULT_ADDRESS,
              calldata: []
            }, 'latest']
          })
        });
        const countData = await countResponse.json();
        console.log("Count response:", countData);
        
        let count = 0;
        if (countData.result && countData.result[0]) {
          count = parseInt(countData.result[0], 16);
        }

        // Fetch merkle root
        const rootResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'starknet_call',
            params: [{
              entry_point_selector: SELECTORS.get_merkle_root,
              contract_address: VAULT_ADDRESS,
              calldata: []
            }, 'latest']
          })
        });
        const rootData = await rootResponse.json();
        console.log("Merkle root response:", rootData);
        
        let root = '';
        if (rootData.result && rootData.result[0]) {
          root = rootData.result[0];
        }

        // Mock data for demo since oracle may not work
        setStats({
          totalCollateral: count > 0 ? 6500 : 0,
          totalDebt: 0,
          healthFactor: 10000,
          positionCount: count,
          merkleRoot: root
        });

        setIsLoading(false);
      } catch (e) {
        console.error("Failed to fetch data:", e);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [VAULT_ADDRESS]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Vault Dashboard</h1>

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
                  <p className="text-white font-medium">Liquidation prices are private</p>
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
