
# Description

  

This repo contains circuits to build ElGamal scheme over the BN254 curve. 
The code to conduct the general elliptic curve operations is a modified version from the [noble-curves]("https://github.com/paulmillr/noble-curves") package to prove compliant results to the field elements dependant circom-circuits.
The protocol in general aims to realize zero knowledge encryption/decryption that offers linear homomorphic properties, for this reason an encoding/decoding algorithm is crucial to preserve linear homomorphism. Many existing mapping, imbedding or encoding techniques are mostly utilized to map a plaintext to a curve point and the encoded point is in most cases undistinguishable when added to another point.
The decoding algorithm in this repo is inspired from [solana-zk-token]("https://github.com/solana-labs/solana/tree/master/zk-token-sdk/src") that uses baby-step/giant-step algorithm to break the discrete log of a 32-bit scalar multiplication to the base point. Accordingly, caching a lookuptable offers O(1) time comlexity that makes decoding faster. Additionally, other optimizations were tried to make it even faster by implementing [Worker Threads]("https://nodejs.org/api/worker_threads.html#workergetenvironmentdatakey") to parallelize computation.
For more information, see the [build README](./build/README.md).

  

## Install

  

`npm install` to install the dependencies.

  

## Build

  

`npm run circom:dev` to build deterministic development circuits.

  
A [powerssOfTau]("https://hermezptau.blob.core.windows.net/ptau/powersOfTau28_hez_final_15.ptau") file will be directly downloaded and intergrated for a direct and swift compilation.
 
`npm run precompute-lookupTable <size>` to precompute a lookupTable used to help break the discrete log of the base multiplied by a 32-bit scalar. The size is to 19 (2^19 values) as default. 

**Note:** Building the lookupTable is crucial to run test-utils for code utilities!

  

## Test

  

`npm run test` to run different circuit tests for EC operations as well as ElGamal encryption and decryption.

`npm run test-utils` to run tests for general Elliptic Curve and ElGamal Scheme operations written in Typescript.

**Note:** What is meant by "*Testing compliance of Encrypt/Decrypt circuits*" is that getting the output of the *"encrypt"* circuit and using it as the input of the *"decrypt"* circuit result in a decrypted message that is identical to the original message used as an input in the *"encrypt"* circuit.
  

## Bechmarking


`npm run benchmark` to benchmark all important circuits;

`npm run benchmark-ec` to benchmark only the circuits for EC operations.

`npm run benchmark-elgamal` to benchmark only the circuits for ElGamal encryption and decryption.

![Elgamal Encrypt/Decrypt Circuit Info](./screenshots/circuit.png)

  


## Clean

  

`npm run delete-artifacts` to delete the artifacts directory containing the artifacts.

`npm run delete-lookupTables` to delete all the lookupTables.
  
  

## Built With

  

Using [Hardhat](https://github.com/nomiclabs/hardhat) and [hardhat-circom](https://github.com/projectsophon/hardhat-circom) makes much easier to compile a circuit and manage the derived files in an organized way by combining [Circom](https://github.com/iden3/circom) and [SnarkJS](https://github.com/iden3/snarkjs) workflow into [Hardhat](https://hardhat.org) a single command.

  

By providing configuration containing your Phase 1 Powers of Tau and circuits, this plugin will:

  

1. Compile the circuits

2. Apply the final beacon

3. Output your `wasm` and `zkey` files

4. Generate and output a `Verifier.sol` (not needed in this project)

  

## References

  

If you want to learn about the details of ElGamal Scheme over Elliptic Curves, feel free to visit this [Notion Page](https://www.notion.so/BN254-ElGamal-Scheme-794db63513a04ff1bf76412fc91616ea).