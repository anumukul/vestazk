// app/lib/CommitmentStorage.ts

export interface CommitmentData {
    commitment: string;
    btcAmount: string; // Stored as a string to preserve precision/bigint
    salt: string;
    merkleRoot: string;
    merklePath: string[];
    merkleIndices: number[];
    timestamp: number;
}

export class CommitmentStorage {
    private static STORAGE_KEY = 'vestazk_commitments';

    static save(address: string, data: CommitmentData): void {
        if (typeof window === 'undefined') return;

        // For hackathon simplicity, we just safely stringify. Look out for actual
        // password encryption in a production app.
        const serialized = JSON.stringify(data);
        localStorage.setItem(`${this.STORAGE_KEY}_${address}`, serialized);
    }

    static load(address: string): CommitmentData | null {
        if (typeof window === 'undefined') return null;

        const data = localStorage.getItem(`${this.STORAGE_KEY}_${address}`);
        if (!data) return null;

        return JSON.parse(data) as CommitmentData;
    }

    static export(address: string): Blob | null {
        if (typeof window === 'undefined') return null;

        const data = localStorage.getItem(`${this.STORAGE_KEY}_${address}`);
        if (!data) return null;

        return new Blob([data], { type: 'application/json' });
    }
}
