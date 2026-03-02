import type { Metadata } from "next";
import "./globals.css";
import { StarknetProvider } from "./components/StarknetProvider";

export const metadata: Metadata = {
  title: "VestaZK - Privacy-Preserving Lending on Starknet",
  description: "Borrow against BTC without revealing your position. MEV bots can't target you for liquidation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <header className="border-b border-gray-700">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">VestaZK</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="hover:text-primary transition">Home</a>
              <a href="/deposit" className="hover:text-primary transition">Deposit</a>
              <a href="/borrow" className="hover:text-primary transition">Borrow</a>
              <a href="/dashboard" className="hover:text-primary transition">Dashboard</a>
              <a href="/exit" className="text-red-400 hover:text-red-300 transition">Emergency Exit</a>
            </div>
          </nav>
        </header>
        <StarknetProvider>
          <main>{children}</main>
        </StarknetProvider>
        <footer className="border-t border-gray-700 mt-20">
          <div className="container mx-auto px-4 py-8 text-center text-gray-400">
            <p>Built on Starknet | Privacy-Preserving Lending</p>
            <p className="text-sm mt-2">⚠️ Hackathon Project - Not Audited</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
