#!/bin/bash

# Check if circom exists in node_modules
if [ -d "./node_modules/circom" ]; then
  # If it exists, delete it and its contents -> deleting it removes the bug that prevents running this script
  rm -r "./node_modules/circom"
fi

# Iterate over files with .circom extension in the current directory
for file in ./circuits/test_circuits/*.circom; do
  # Extract the base name without the extension
  circuit_name=$(basename "$file" .circom)
  # Run the build-circuit script with the circuit name as an argument
  ./scripts/build-circuit.sh $circuit_name
done
