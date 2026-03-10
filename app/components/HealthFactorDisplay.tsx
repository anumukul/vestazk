'use client';

import React from 'react';

interface HealthFactorDisplayProps {
    health: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

function getColor(h: number): string {
    if (h >= 1.5) return 'text-green-400';
    if (h >= 1.2) return 'text-yellow-400';
    return 'text-red-400';
}

function getBgColor(h: number): string {
    if (h >= 1.5) return 'bg-green-900/30 border-green-700';
    if (h >= 1.2) return 'bg-yellow-900/30 border-yellow-700';
    return 'bg-red-900/30 border-red-700';
}

function getLabel(h: number): string {
    if (h >= 1.5) return 'Safe';
    if (h >= 1.2) return 'Moderate';
    return 'At Risk';
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): { value: string; label: string } {
    switch (size) {
        case 'sm':
            return { value: 'text-lg font-bold', label: 'text-xs' };
        case 'lg':
            return { value: 'text-3xl font-bold', label: 'text-base' };
        case 'md':
        default:
            return { value: 'text-2xl font-bold', label: 'text-sm' };
    }
}

export function HealthFactorDisplay({ health, showLabel = true, size = 'md' }: HealthFactorDisplayProps) {
    const sizeClasses = getSizeClasses(size);

    return (
        <div className={`p-4 rounded-lg border ${getBgColor(health)}`}>
            <p className="text-gray-300 mb-1">Health Factor:</p>
            <div className="flex items-center gap-2">
                <span className={`${sizeClasses.value} ${getColor(health)}`}>
                    {health === Infinity ? '∞' : health.toFixed(2)}x
                </span>
                {showLabel && (
                    <span className={`${sizeClasses.label} text-gray-400`}>
                        {health === Infinity ? 'No Debt' : getLabel(health)}
                    </span>
                )}
            </div>
        </div>
    );
}

export function HealthFactorBar({ health, minRequired }: { health: number; minRequired: number }) {
    const percentage = Math.min((health / 3) * 100, 100); // 3x = full bar
    const isHealthy = health >= minRequired;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Health Factor</span>
                <span className={isHealthy ? 'text-green-400' : 'text-red-400'}>
                    {health === Infinity ? '∞' : health.toFixed(2)}x
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                    className={`h-3 rounded-full transition-all duration-500 ${health >= 1.5
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : health >= 1.2
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500">
                {isHealthy ? '✓ Sufficient collateral' : `✗ Below minimum (${minRequired}x)`}
            </p>
        </div>
    );
}
