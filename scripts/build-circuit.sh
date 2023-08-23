#!/bin/sh
set -e

# --------------------------------------------------------------------------------
# Phase 2
# ... circuit-specific stuff

# Check if artifacts/circuitName exists
if [ -d "./circuits/artifacts/$1" ]; then
  # If it exists, delete it and its contents
  rm -r "./circuits/artifacts/$1"
fi

# Create a directory for the circuit
mkdir -p "./circuits/artifacts/$1"


# Compile circuit => $1 will refer to the full circuit name
CIRCUIT_NAME="${1%%_*}"
circom ./circuits/test_circuits/$1.circom -o ./circuits/artifacts/$1 --r1cs --wasm

#Setup
yarn snarkjs groth16 setup ./circuits/artifacts/$1/$1.r1cs ./circuits/artifacts/ptau/pot15.ptau ./circuits/artifacts/$1/$CIRCUIT_NAME.zkey

# # Generate reference zkey
yarn snarkjs zkey new ./circuits/artifacts/$1/$1.r1cs ./circuits/artifacts/ptau/pot15.ptau ./circuits/artifacts/$1/$1_0000.zkey

# # Ceremony just like before but for zkey this time
yarn snarkjs zkey contribute ./circuits/artifacts/$1/$1_0000.zkey ./circuits/artifacts/$1/$1_0001.zkey \
    --name="First $1 contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

yarn snarkjs zkey contribute ./circuits/artifacts/$1/$1_0001.zkey ./circuits/artifacts/$1/$1_0002.zkey \
    --name="Second $1 contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

yarn snarkjs zkey contribute ./circuits/artifacts/$1/$1_0002.zkey ./circuits/artifacts/$1/$1_0003.zkey \
    --name="Third $1 contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

# #  Verify zkey
yarn snarkjs zkey verify ./circuits/artifacts/$1/$1.r1cs ./circuits/artifacts/ptau/pot15.ptau ./circuits/artifacts/$1/$1_0003.zkey

# # Apply random beacon as before
yarn snarkjs zkey beacon ./circuits/artifacts/$1/$1_0003.zkey ./circuits/artifacts/$1/$CIRCUIT_NAME.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="$1 FinalBeacon phase2"

# # Optional: verify final zkey
yarn snarkjs zkey verify ./circuits/artifacts/$1/$1.r1cs ./circuits/artifacts/ptau/pot15.ptau ./circuits/artifacts/$1/$CIRCUIT_NAME.zkey

# # Export verification key
yarn snarkjs zkey export verificationkey ./circuits/artifacts/$1/$CIRCUIT_NAME.zkey ./circuits/artifacts/$1/$CIRCUIT_NAME.vkey.json


rm ./circuits/artifacts/$1/$1_000*.zkey
mv ./circuits/artifacts/$1/$1_js/$1.wasm ./circuits/artifacts/$1
rm -rf ./circuits/artifacts/$1/$1_js

# Rename the wasm and r1cs output files
mv ./circuits/artifacts/$1/$1.r1cs ./circuits/artifacts/$1/$CIRCUIT_NAME.r1cs
mv ./circuits/artifacts/$1/$1.wasm ./circuits/artifacts/$1/$CIRCUIT_NAME.wasm
