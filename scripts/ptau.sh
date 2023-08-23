#!/usr/bin/env sh

set -e

# --------------------------------------------------------------------------------
# Phase 1
# ... non-circuit-specific stuff

# if circuits/artifacts does not exist, make folder
[ -d ./circuits/artifacts ] || mkdir ./circuits/artifacts

# Check if artifacts/ptau exists
if [ -d ./circuits/artifacts/ptau  ]; then
  # If it exists, delete it and its contents
  rm -r ./circuits/artifacts/ptau 
fi
# Create a directory for the ptau file
mkdir -p ./circuits/artifacts/ptau 

POWERS_OF_TAU=15 # circuit will support max 2^POWERS_OF_TAU constraints
if [ ! -f ./ptau$POWERS_OF_TAU ]; then
  echo "Downloading powers of tau file"
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_$POWERS_OF_TAU.ptau --create-dirs -o ./circuits/artifacts/ptau/pot$POWERS_OF_TAU.ptau
fi