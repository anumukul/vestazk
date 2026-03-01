'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCollateral: 0,
    totalDebt: 0,
    healthFactor: 0,
    positionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching vault stats
    const fetchStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats({
        totalCollateral: 125.5,
        totalDebt: 4500000,
        healthFactor: 1.35,
        positionCount: 42,
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Vault Dashboard</h1>

      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading vault statistics...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Collateral</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats.totalCollateral.toLocaleString()} BTC
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
              <p className={`text-2xl font-bold mt-1 ${
                stats.healthFactor >= 1.3 ? 'text-green-400' :
                stats.healthFactor >= 1.1 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {(stats.healthFactor * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">Total Positions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.positionCount}
              </p>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">Vault Status</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full"
                  style={{ width: `${Math.min(stats.healthFactor * 70, 100)}%` }}
                ></div>
              </div>
              <span className={`font-semibold ${
                stats.healthFactor >= 1.3 ? 'text-green-400' :
                stats.healthFactor >= 1.1 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {stats.healthFactor >= 1.3 ? 'Healthy' : stats.healthFactor >= 1.1 ? 'Moderate' : 'At Risk'}
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
