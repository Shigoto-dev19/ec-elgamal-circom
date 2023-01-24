
# Description

  

This repo contains circuits to build ElGamal scheme over alt_bn128.

  

## Install

  

`npm install` to install the dependencies.

  

## Build

  

`npm run circom:dev` to build deterministic development circuits.

  

A [powerssOfTau]("https://hermezptau.blob.core.windows.net/ptau/powersOfTau28_hez_final_15.ptau") file will be directly downloaded and intergrated for a direct and swift compilation.

  

## Test

  

`npm run test` to run different circuit tests for EC operations as well as ElGamal encryption and decryption.

`npm run test-utils` to run tests for EC operations written in Typescript.

  

## Bechmarking

  

`npm run benchmark` to benchmark all important circuits;

`npm run benchmark-elgamal` to benchmark only the circuits for ElGamal encryption and decryption.

`npm run benchmark-ec` to benchmark only the circuits for EC operations.

  

**Note:** What is meant by "*Testing compliance of Encrypt/Decrypt circuits*" is that getting the output of the *"encrypt"* circuit and using it as the input of the *"decrypt"* circuit result in a decrypted message that is identical to the original message used as an input in the *"encrypt"* circuit.

  

## Clean

  

`npm run delete-artifacts` to delete the artifacts directory containing the artifacts.

  
  

## Built With

  

Using [Hardhat](https://github.com/nomiclabs/hardhat) and [hardhat-circom](https://github.com/projectsophon/hardhat-circom) makes much easier to compile a circuit and manage the derived files in an organized way by combining [Circom](https://github.com/iden3/circom) and [SnarkJS](https://github.com/iden3/snarkjs) workflow into [Hardhat](https://hardhat.org) a single command.

  

By providing configuration containing your Phase 1 Powers of Tau and circuits, this plugin will:

  

1. Compile the circuits

2. Apply the final beacon

3. Output your `wasm` and `zkey` files

4. Generate and output a `Verifier.sol` (not needed in this project)

  

## References

  

If you want to learn about the details of ElGamal Scheme over Elliptic Curves, feel free to visit this [Notion Page](https://www.notion.so/BN254-ElGamal-Scheme-794db63513a04ff1bf76412fc91616ea).