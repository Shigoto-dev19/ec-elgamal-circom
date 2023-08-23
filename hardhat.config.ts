import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-circom";


const config: HardhatUserConfig = {
    
    solidity: "^0.8.0",
    circom: {
        // (optional) Base path for files being read, defaults to `./circuits/`
        inputBasePath: "./circuits/test_ciruits",
        // (optional) Base path for files being output, defaults to `./artifacts/`
        outputBasePath: "./artifacts",
        // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
        ptau: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau",
        // (required) Each object in this array refers to a separate circuit
        circuits: [
          {
            name: "addPoint_test",
            input: "../inputs/add.json",
            zkey: "./addPoint/addPoint.zkey",
            wasm: "./addPoint/addPoint.wasm"
          },
          {
            name: "doublePoint_test",
            input: "../inputs/double.json",
            zkey: "./doublePoint/doublePoint.zkey",
            wasm: "./doublePoint/doublePoint.wasm"
          },
          {
            name: "multiplyPoint_test",
            input: "../inputs/multiply.json",
            zkey: "./multiplyPoint/multiplyPoint.zkey",
            wasm: "./multiplyPoint/multiplyPoint.wasm"
          },
          {
            name: "encrypt_test",
            input: "../inputs/encrypt.json",
            zkey: "./encrypt/encrypt.zkey",
            wasm: "./encrypt/encrypt.wasm"
          },
          {
            name: "decrypt_test",
            input: "../inputs/decrypt.json",
            zkey: "./decrypt/decrypt.zkey",
            wasm: "./decrypt/decrypt.wasm"
          },
          
        ],
      },
    };


export default config;
