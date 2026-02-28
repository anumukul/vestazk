#!/bin/bash
# Generate Garaga Verifier for Lending Proof Circuit
# Run this in a Codespace with the correct toolchain versions

set -e

echo "=== VestaZK Verifier Generation ==="

# Verify versions
echo "Checking toolchain versions..."
nargo --version
bb --version

# Navigate to circuit
cd zk-badges/lending_proof

# Step 1: Compile circuit
echo "Compiling Noir circuit..."
nargo compile

# Step 2: Generate verification key with Barretenberg
echo "Generating verification key..."
bb write_vk \
    -b target/lending_proof.json \
    -o target/ \
    -t starknet \
    -s ultra_honk

# Step 3: Generate Cairo verifier using Garaga
echo "Generating Cairo verifier..."
garaga gen \
    --system ultra_keccak_honk \
    --vk target/vk \
    --project-name lending_proof_verifier \
    --output ../../contracts/src/

echo "=== Verifier generated successfully! ==="
echo "Output: contracts/src/lending_proof_verifier/"
