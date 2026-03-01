import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-20">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Privacy-Preserving Lending
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Borrow against your BTC without revealing your position. MEV bots cannot target you for liquidation 
          because your health factor stays private.
        </p>
        <div className="flex justify-center space-x-4">
          <Link 
            href="/deposit" 
            className="px-8 py-3 bg-primary rounded-lg font-semibold hover:bg-primary/80 transition"
          >
            Start Lending
          </Link>
          <Link 
            href="/dashboard" 
            className="px-8 py-3 border border-gray-500 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Private Positions</h3>
          <p className="text-gray-400">
            Your collateral amount, debt level, and liquidation price are never revealed on-chain.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="text-3xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold mb-2">Anti-MEV Protection</h3>
          <p className="text-gray-400">
            Zero-knowledge proofs verify your health factor without revealing actual numbers.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Aggregate Transparency</h3>
          <p className="text-gray-400">
            Only the vault&apos;s total health is public. Individual positions remain completely hidden.
          </p>
        </div>
      </section>

      <section className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-20">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
            <p className="text-gray-300">Deposit WBTC</p>
          </div>
          <div className="text-gray-500">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
            <p className="text-gray-300">Generate Commitment</p>
          </div>
          <div className="text-gray-500">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
            <p className="text-gray-300">Create ZK Proof</p>
          </div>
          <div className="text-gray-500">→</div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div>
            <p className="text-gray-300">Borrow USDC</p>
          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-6">Connect your wallet and start using private lending today.</p>
        <Link 
          href="/deposit" 
          className="px-8 py-3 bg-secondary text-gray-900 rounded-lg font-semibold hover:bg-secondary/80 transition"
        >
          Deposit Now
        </Link>
      </section>
    </div>
  );
}
