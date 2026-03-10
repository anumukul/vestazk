'use client';

import React from 'react';

interface HealthFactorDisplayProps {
    health: number | null;
}

export function HealthFactorDisplay({ health }: HealthFactorDisplayProps) {
    if (health === null) return null;

    const isSafe = health >= 1.5;
    const isAtRisk = health < 1.15;

    let statusColor = 'text-green-400';
    let statusText = 'Safe';
    let bgColor = 'bg-green-900/20';
    let borderColor = 'border-green-700/50';

    if (isAtRisk) {
        statusColor = 'text-red-400';
        statusText = 'At Risk';
        bgColor = 'bg-red-900/20';
        borderColor = 'border-red-700/50';
    } else if (!isSafe) {
        statusColor = 'text-yellow-400';
        statusText = 'Moderate';
        bgColor = 'bg-yellow-900/20';
        borderColor = 'border-yellow-700/50';
    }

    return (
        <div className={`mt-4 p-4 rounded-lg border ${bgColor} ${borderColor} transition-all duration-300`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-sm">Estimated Health Factor</span>
                <span className={`text-sm font-bold ${statusColor} px-2 py-0.5 rounded-full border border-current/20 bg-current/5`}>
                    {statusText}
                </span>
            </div>
            <div className={`text-2xl font-bold ${statusColor}`}>
                {health.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Liquidation occurs if health factor drops below 1.0.
                Your min required borrow health is 1.1x.
            </p>
        </div>
    );
}

interface HealthFactorBarProps {
    health: number | null;
    minRequired: number;
}

export function HealthFactorBar({ health, minRequired }: HealthFactorBarProps) {
    if (health === null || health === 0) return (
        <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
            <div className="bg-gray-600 h-full text-[10px] text-center text-white">N/A</div>
        </div>
    );

    const displayHealth = Math.min(health, 3);
    const percentage = (displayHealth / 3) * 100;

    let barColor = 'bg-green-500';
    if (health < 1.15) barColor = 'bg-red-500';
    else if (health < 1.5) barColor = 'bg-yellow-500';

    return (
        <div className="space-y-2">
            <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden relative">
                <div
                    className={`${barColor} h-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Min required marker */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                    style={{ left: `${(minRequired / 3) * 100}%` }}
                    title={`Min required: ${minRequired}`}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
                <span>0</span>
                <span style={{ marginLeft: `${(minRequired / 3) * 100 / 2}%` }}>Min ({minRequired})</span>
                <span>3.0+</span>
            </div>
        </div>
    );
}
