import * as bench from 'micro-bmark';
import { encrypt, genKeypair } from "../src/index";
import { getSignalByName, stringifyBigInts, toBigIntArray, toStringArray } from '../utils/tools';

const snarkjs = require("snarkjs");
const path = require("path");
const wasm_tester = require('circom_tester').wasm;

const wasm_path_encrypt = "./circuits/artifacts/encrypt_test/encrypt.wasm";
const zkey_path_encrypt = "./circuits/artifacts/encrypt_test/encrypt.zkey";

const genCircuitInputs = () => {
    const keypair = genKeypair();
    const encryption = encrypt(keypair.pubKey);
    const encrypted_message = toStringArray(encryption.encrypted_message);

    let input_encrypt = stringifyBigInts({
        message: toBigIntArray(encryption.message),
        nonceKey: encryption.nonce,
        publicKey: toBigIntArray(keypair.pubKey),
    });
    
    return { input_encrypt, encrypted_message }
}

async function test_snarkjs() {
    const { input_encrypt, encrypted_message } = genCircuitInputs();

    const prove_encrypt = await snarkjs.groth16.fullProve(
        input_encrypt,
        wasm_path_encrypt,
        zkey_path_encrypt,
    );
    const publicSignals_encrypt = prove_encrypt.publicSignals;

    const resX = (publicSignals_encrypt[2] == encrypted_message[0]);
    const resY = (publicSignals_encrypt[3] == encrypted_message[1]);
    
    return resX && resY
}

async function test_circom_tester(circuit) {

    const { input_encrypt, encrypted_message } = genCircuitInputs();
    
    const witness = await circuit.calculateWitness(input_encrypt);
    await circuit.checkConstraints(witness);
    await circuit.loadSymbols();

    const resX = (getSignalByName(circuit, witness, 'encryptedMessage[0]') == encrypted_message[0]);
    const resY = (getSignalByName(circuit, witness, 'encryptedMessage[1]') == encrypted_message[1]);
    return resX && resY
}

const { compare, run } = bench; 
run(async () => {
      
    const circuit = await wasm_tester(path.resolve("./circuits/test_circuits/encrypt_test.circom"));
    await compare('Testing Circom Circuits', 50, {
        snarkjs: async() => await test_snarkjs(),
        circom_tester: async() => await test_circom_tester(circuit),
    });
    bench.utils.logMem(); // Log current RAM
    (globalThis as any).curve_bn128.terminate();
    // console.log(bench.utils.getTime(), bench.utils.formatD(bench.utils.getTime())); // Get current time in nanoseconds
});

