# Development Setup

## Prerequisites

- **Node.js**: 18+ (for Bun)
- **Bun**: Latest (package manager)
- **Python**: 3.10 specifically (for Garaga)
- **Git**: Latest

## Quick Start: GitHub Codespaces (30 minutes)

**Recommended Path**: Avoids local environment issues.

### Why Codespaces?

From the [tutorial](https://espejel.bearblog.dev/starknet-privacy-toolkit/):

> "Noir, BB, and Garaga are sensitive to OS versions and system libraries. Codespaces gives a clean Linux environment that matches the toolchain. Fewer local setup surprises means faster onboarding for hackers."

### Steps

1. **Create Codespace**
   - Fork this repo on GitHub
   - Click "Code" → "Codespaces" → "Create codespace on main"
   - Wait for container to build (~2 minutes)

2. **Run Setup Script**
   ```bash
   chmod +x setup-codespace.sh
   ./setup-codespace.sh
   ```
   
   This installs (takes ~30 minutes):
   - Scarb 2.6.3+ (Cairo toolchain)
   - Noir 1.0.0-beta.1 (EXACT version)
   - Barretenberg 0.67.0 (EXACT version)
   - Garaga 0.15.5 (EXACT version)
   - Starknet Foundry (testing)

3. **Verify Installation**
   ```bash
   nargo --version
   # Output: nargo version = 1.0.0-beta.1
   
   bb --version
   # Output: 0.67.0
   
   source garaga-env/bin/activate
   garaga --version
   # Output: garaga 0.15.5
   ```

4. **Install Bun Dependencies**
   ```bash
   bun install
   ```

5. **Test Everything Works**
   ```bash
   bun run check:health
   ```

### Common Codespaces Issues

**Issue**: `curl: (6) Could not resolve host: noirup.dev`

**Fix**: Use GitHub mirrors instead. The script should handle this automatically. If not:
```bash
curl -fsSL https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
curl -fsSL https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/bbup/install | bash
```

**Issue**: Codespace DNS can be flaky

**Fix**: Restart the Codespace and re-run setup script.

## Manual Local Setup (1 hour)

⚠️ **Not Recommended**: OS-specific issues are common.

### Install Noir

```bash
# Install noirup
curl -L https://noirup.dev | bash
source ~/.bashrc

# Install specific version (CRITICAL)
noirup --version 1.0.0-beta.1

# Verify
nargo --version
# Must show: nargo version = 1.0.0-beta.1
```

### Install Barretenberg

```bash
# Install bbup
curl -L https://bbup.dev | bash
source ~/.bashrc

# Install specific version (CRITICAL)
bbup --version 0.67.0

# Install dependencies (Ubuntu/Debian)
sudo apt-get install -y libc++-dev libc++abi-dev

# Verify
bb --version
# Must show: 0.67.0
```

### Install Garaga

⚠️ **CRITICAL**: Requires Python 3.10 specifically (not 3.11+)

```bash
# Add Python 3.10 repository (Ubuntu/Debian)
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update
sudo apt-get install -y python3.10 python3.10-venv python3.10-dev

# Create virtual environment
python3.10 -m venv garaga-env

# Activate and install
source garaga-env/bin/activate
pip install garaga==0.15.5

# Verify
garaga --version
# Must show: garaga 0.15.5 or higher
```

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Verify
bun --version
```

### Install Starknet Foundry

```bash
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | bash
source ~/.bashrc
snforge --version
```

### Install Project Dependencies

```bash
bun install
cd contracts && scarb build
```

## Environment Variables

Create `.env.local`:

```bash
# Copy example
cp .env.example .env.local

# Edit with your values
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Tongo (from toolkit)
NEXT_PUBLIC_TONGO_SEPOLIA=0x00f34d7f4558e0634832e5fc3c3fc31f3ec55f8a

# VestaZK contracts (will be added after deployment)
NEXT_PUBLIC_VESTAZK_VAULT=
NEXT_PUBLIC_VESTAZK_VERIFIER=
```

## Verify Setup

### 1. Health Check
```bash
bun run check:health
```

Expected output:
```
✓ Node.js version: v20.x.x
✓ Bun version: x.x.x
✓ Noir version: 1.0.0-beta.1
✓ Barretenberg version: 0.67.0
✓ Garaga version: 0.15.5
✓ Scarb version: 2.6.3
✓ Setup complete!
```

### 2. Test Toolkit Features

```bash
# Initialize Tongo
bun run tongo:init

# Run quickstart example
bun run template:quickstart

# Test donation badge circuit
cd zk-badges/donation_badge
nargo test
```

### 3. Build Contracts

```bash
cd contracts
scarb build
```

## Troubleshooting

### "nargo: command not found"

Noir is not installed or not in PATH.

**Fix**:
```bash
source ~/.bashrc
nargo --version
```

If still fails, reinstall:
```bash
noirup --version 1.0.0-beta.1
```

### "bb: libc++.so.1 not found"

Missing C++ runtime libraries.

**Fix**:
```bash
sudo apt-get install -y libc++-dev libc++abi-dev
```

### "Garaga: Requires Python <3.11"

Wrong Python version.

**Fix**:
```bash
python --version
# If not 3.10, create venv with python3.10
python3.10 -m venv garaga-env
source garaga-env/bin/activate
pip install garaga==0.15.5
```

### "Invalid proof" or Verification Fails

Version mismatch between Noir/BB/Garaga.

**Fix**:
```bash
# Check versions
nargo --version  # Must be 1.0.0-beta.1
bb --version     # Must be 0.67.0
source garaga-env/bin/activate && garaga --version  # Must be 0.15.5+

# If wrong, reinstall with EXACT versions
noirup --version 1.0.0-beta.1
bbup --version 0.67.0
pip install garaga==0.15.5
```

### Proof Generation Takes Too Long (>2 minutes)

Expected time: 30-60 seconds.

**Possible causes**:
- Slow CPU (proof generation is CPU-intensive)
- Running in VM with limited resources
- Background processes consuming CPU

**Fix**: Use Codespaces (better hardware) or wait patiently.

## Next Steps

Once setup is complete:

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical overview
2. Review [DEVELOPMENT.md](./DEVELOPMENT.md) for workflow
3. Check [ROADMAP.md](./ROADMAP.md) for project phases
4. Start building! See the development guide

## Resources

- **Setup Issues**: Check [GitHub Issues](https://github.com/anumukul/vestazk/issues)
- **Noir Docs**: https://noir-lang.org/docs
- **Garaga Docs**: https://garaga.gitbook.io/garaga
- **Toolkit Tutorial**: https://espejel.bearblog.dev/starknet-privacy-toolkit/
