
# Description

  

This repo contains circuits to build ElGamal scheme over the [Baby Jubjub](https://eips.ethereum.org/EIPS/eip-2494) curve.

The code to conduct the general elliptic curve operations is a custiom twisted edwards curve from the [noble-curves]("https://github.com/paulmillr/noble-curves") package to prove compliant results to the field elements dependant circom-circuits.

The protocol in general aims to realize zero knowledge encryption/decryption that offers linear homomorphic properties.

 - An encoding/decoding algorithm is crucial to preserve linear homomorphism. Many existing mapping, imbedding or encoding techniques are mostly utilized to map a plaintext to a curve point and the encoded point is in most cases undistinguishable when added to another point.

- The decoding algorithm in this repo is inspired from [solana-zk-token]("https://github.com/solana-labs/solana/tree/master/zk-token-sdk/src") that uses baby-step/giant-step algorithm to break the discrete log of a 32-bit scalar multiplication to the base point. 

  - Caching a lookuptable offers O(1) time comlexity that makes decoding faster. 
  - Additionally, other optimizations were tried to make it even faster by implementing [Worker Threads]("https://nodejs.org/api/worker_threads.html#workergetenvironmentdatakey") to parallelize computation.
  - Unfortunately, it is not efficient enough to use native js concurrency and that is why the protocol will take advantage of Rust's ```Fearless Concurrency``` to break the 32-bit ECDL as fast as possible.

  

## Install

  

`yarn install` to install the dependencies.

  

## Build

1. `yarn ptau` to download a [powerssOfTau]("https://hermezptau.blob.core.windows.net/ptau/powersOfTau28_hez_final_15.ptau") file directly for a direct and swift compilation to build circuits later.

2. `yarn build-circuits` to build deterministic development circuits.
 
3. `yarn precompute-lookupTable <size>` to precompute a lookupTable used to help break the discrete log of the base multiplied by a 32-bit scalar. 

  - **Note:** Building a lookupTable of size=19 is crucial to run the tests! 





  

## Test

  

`yarn test` to run different circuit tests for EC operations as well as ElGamal encryption and decryption.

`yarn test-circuits` to run circuit tests only.

`yarn test-elgamal` to run ElGamal Encrypt/Decrypt & Encode/Decode tests only.

**Note:** What is meant by "*Testing compliance of Encrypt/Decrypt circuits*" is that getting the output of the *"encrypt"* circuit and using it as the input of the *"decrypt"* circuit result in a decrypted message that is identical to the original message used as an input in the *"encrypt"* circuit.
  

## Bechmarking

**Note:** You can run the following commands individually or just read a summary of the benchmarks in the [benchmarks README](./benchmark/README.md)

`yarn r1cs-info-elgamal` to log all important Encrypt/Decrypt circuit infos;

`yarn benchmark-babyjub` to benchmark Baby Jubjub EC addition and multiplication between [noble](https://github.com/paulmillr/noble-curves) & [circomlibjs](https://github.com/iden3/circomlibjs/blob/main/src/babyjub.js) packages.

`yarn benchmark-decode` to benchmark decoding speed using different lookup table sizes.
`yarn benchmark-circom_tester` to benchmark the speed between [snarkjs](https://github.com/iden3/snarkjs/tree/master) and [circom_tester](https://github.com/iden3/circom_tester) for circuit testing purposes.



  


## Clean

`yarn delete-lookupTables` to delete all the lookupTables.
  
  

## Scripts

  

The ```ptau``` and ```build-all-circuits``` scripts make it much easier to compile all circuit and manage the derived files in an organized way by combining [Circom](https://github.com/iden3/circom) and [SnarkJS](https://github.com/iden3/snarkjs) workflow into a single command.

  

By providing configuration containing your Phase 1 Powers of Tau and circuits, this plugin will:

  

1. Compile the circuits

2. Apply the final beacon

3. Output your `wasm` and `zkey` files

  

## References

  

If you want to learn about the details of ElGamal Scheme over Elliptic Curves, feel free to visit this [Notion Page](https://www.notion.so/BN254-ElGamal-Scheme-794db63513a04ff1bf76412fc91616ea).