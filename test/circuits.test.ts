const expect = require("chai").expect;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const wasm_tester = require("circom_tester").wasm;
// Load chai-as-promised support
chai.use(chaiAsPromised);

import { ExtPointType } from "@noble/curves/abstract/edwards";
import {
    genKeypair,
    genRandomSalt,
    encrypt,
    genRandomPoint,
    Keypair,
    BabyJubExtPoint,
} from "../src";
import {
    toStringArray,
    stringifyBigInts,
    toBigIntArray,
    formatPrivKeyForBabyJub,
    coordinatesToExtPoint,
    getSignalByName,
} from "../utils/tools";
import { assert } from "chai";

type EncryptCircuitInputs = {
    message: string[];
    nonceKey: string;
    publicKey: string[];
};

type DecryptCircuitInputs = {
    encryptedMessage: string[];
    ephemeralKey: string[];
    privateKey: string;
};

const genCircuitInputs = (
    keypair: Keypair,
    encodedMessage?: BabyJubExtPoint,
): {
    input_encrypt: EncryptCircuitInputs;
    ephemeral_key: string[];
    encrypted_message: string[];
} => {
    const encryption = encrypt(keypair.pubKey, encodedMessage);

    let input_encrypt: EncryptCircuitInputs = stringifyBigInts({
        message: toBigIntArray(encryption.message),
        nonceKey: encryption.nonce,
        publicKey: toBigIntArray(keypair.pubKey),
    });

    const ephemeral_key = toStringArray(encryption.ephemeral_key);
    const encrypted_message = toStringArray(encryption.encrypted_message);
    return { input_encrypt, ephemeral_key, encrypted_message };
};

const loadCircuit = async (circuit, inputs_object, witness_return = false) => {
    const witness = await circuit.calculateWitness(inputs_object, true);
    await circuit.checkConstraints(witness);
    await circuit.loadSymbols();
    if (witness_return) return witness;
};

const securityCheck = async (
    circuit: any,
    invalid_input: EncryptCircuitInputs | DecryptCircuitInputs,
    errorMessage: string,
) => {
    try {
        await loadCircuit(circuit, invalid_input);
        throw new Error("Expected to throw an error");
    } catch (error) {
        expect(error.message).to.contain(errorMessage);
    }
};

describe("Testing ElGamal Scheme Circuits\n", () => {
    let encryptCircuit: any;
    let decryptCircuit: any;

    before(async () => {
        encryptCircuit = await wasm_tester("./circuits/test_circuits/encrypt_test.circom");
        decryptCircuit = await wasm_tester("./circuits/test_circuits/decrypt_test.circom");
    });

    context("Testing Encrypt Circuit", () => {
        let input_encrypt: EncryptCircuitInputs;
        let keypair: Keypair;
        let ephemeral_key: string[];
        let encrypted_message: string[];
        let encrypt_witness: any;

        before(async () => {
            keypair = genKeypair();
            const object = genCircuitInputs(keypair);
            input_encrypt = object.input_encrypt;
            ephemeral_key = object.ephemeral_key;
            encrypted_message = object.encrypted_message;

            encrypt_witness = await encryptCircuit.calculateWitness(input_encrypt, true);
        });

        it("Verify circuit is resistant to invalid curve attacks: Invalid Public Key: not on curve", async () => {
            const invalid_input = {
                message: input_encrypt.message,
                nonceKey: input_encrypt.nonceKey,
                publicKey: ["1", "0"],
            };
            await securityCheck(
                encryptCircuit,
                invalid_input,
                "Error in template Encrypt_19 line: 59",
            );
        });

        it("Verify circuit is resistant to invalid curve attacks: Invalid Public Key: identity", async () => {
            const invalid_input = {
                message: input_encrypt.message,
                nonceKey: input_encrypt.nonceKey,
                publicKey: ["0", "1"],
            };
            await securityCheck(
                encryptCircuit,
                invalid_input,
                "Error in template Encrypt_19 line: 52",
            );
        });

        it("Verify Message assertion to be a point on curve", async () => {
            const invalid_input = {
                message: ["1", "0"],
                nonceKey: input_encrypt.nonceKey,
                publicKey: input_encrypt.publicKey,
            };
            await securityCheck(
                encryptCircuit,
                invalid_input,
                "Error in template Encrypt_19 line: 64",
            );
        });

        it("Verify compliant encrypt output", async () => {
            // Verify compliant encryption output for the ephemeral key
            await encryptCircuit.assertOut(encrypt_witness, { ephemeralKey: ephemeral_key });
            // Verify compliant encryption output for the encrypted message
            await encryptCircuit.assertOut(encrypt_witness, {
                encryptedMessage: encrypted_message,
            });
        });

        it("Verify false encrypt output is invalid", async () => {
            input_encrypt.nonceKey = formatPrivKeyForBabyJub(genRandomSalt());
            const encrypt_witness = await loadCircuit(encryptCircuit, input_encrypt, true);

            await assert.isRejected(
                encryptCircuit.assertOut(encrypt_witness, { ephemeralKey: ephemeral_key }),
            );
            await assert.isRejected(
                encryptCircuit.assertOut(encrypt_witness, { encryptedMessage: encrypted_message }),
            );
        });

        it("Looped: Verify compliant encrypt output for random inputs", async () => {
            for (let i = 0; i < 100; i++) {
                keypair = genKeypair();
                let { input_encrypt, ephemeral_key, encrypted_message } = genCircuitInputs(keypair);
                let encrypt_witness = await encryptCircuit.calculateWitness(input_encrypt, true);

                await encryptCircuit.assertOut(encrypt_witness, { ephemeralKey: ephemeral_key });
                await encryptCircuit.assertOut(encrypt_witness, {
                    encryptedMessage: encrypted_message,
                });
            }
        });
    });

    context("Testing Decrypt Circuit", () => {
        let input_encrypt: EncryptCircuitInputs;
        let input_decrypt: DecryptCircuitInputs;
        let keypair: Keypair;
        let ephemeral_key: string[];
        let encrypted_message: string[];
        let message: string[];
        let encodedMessage: ExtPointType;
        let decrypt_witness: any;

        before(async () => {
            keypair = genKeypair();
            encodedMessage = genRandomPoint();
            message = toStringArray(encodedMessage);

            const encryption = genCircuitInputs(keypair, encodedMessage);
            input_encrypt = encryption.input_encrypt;
            ephemeral_key = encryption.ephemeral_key;
            encrypted_message = encryption.encrypted_message;

            input_decrypt = {
                encryptedMessage: encrypted_message,
                ephemeralKey: ephemeral_key,
                privateKey: formatPrivKeyForBabyJub(keypair.privKey),
            };

            decrypt_witness = await decryptCircuit.calculateWitness(input_decrypt, true);
        });

        it("Verify encryptedMessage assertion to be a point on curve", async () => {
            const invalid_input = {
                encryptedMessage: ["1", "0"],
                ephemeralKey: input_decrypt.ephemeralKey,
                privateKey: input_decrypt.privateKey,
            };
            await securityCheck(
                decryptCircuit,
                invalid_input,
                "Error in template Decrypt_13 line: 23",
            );
        });

        it("Verify ephemeralKey assertion to be a point on curve", async () => {
            const invalid_input = {
                encryptedMessage: input_decrypt.encryptedMessage,
                ephemeralKey: ["1", "0"],
                privateKey: input_decrypt.privateKey,
            };
            await securityCheck(
                decryptCircuit,
                invalid_input,
                "Error in template Decrypt_13 line: 27",
            );
        });

        it("Verify compliant decrypt output", async () => {
            // Verify compliant decryption output of the decrypted message
            await decryptCircuit.assertOut(decrypt_witness, { decryptedMessage: message });
            // Verify compliant decryption input for the encrypted message
            await decryptCircuit.assertOut(decrypt_witness, {
                encryptedMessage: encrypted_message,
            });
        });

        it("Verify false decrypt output is invalid", async () => {
            // only modify the private key
            input_decrypt.privateKey = formatPrivKeyForBabyJub(genRandomSalt());
            const decrypt_witness = await decryptCircuit.calculateWitness(input_decrypt, true);

            await assert.isRejected(
                decryptCircuit.assertOut(decrypt_witness, { decryptedMessage: message }),
            );
        });

        it("Looped: Verify compliant decrypt output for random inputs", async () => {
            for (let i = 0; i < 100; i++) {
                keypair = genKeypair();
                encodedMessage = genRandomPoint();
                message = toStringArray(encodedMessage);

                const object = genCircuitInputs(keypair, encodedMessage);
                input_encrypt = object.input_encrypt;
                ephemeral_key = object.ephemeral_key;
                encrypted_message = object.encrypted_message;

                input_decrypt = {
                    encryptedMessage: encrypted_message,
                    ephemeralKey: ephemeral_key,
                    privateKey: formatPrivKeyForBabyJub(keypair.privKey),
                };

                const decrypt_witness = await decryptCircuit.calculateWitness(input_decrypt, true);

                await decryptCircuit.assertOut(decrypt_witness, { decryptedMessage: message });
                await decryptCircuit.assertOut(decrypt_witness, {
                    encryptedMessage: encrypted_message,
                });
            }
        });
    });

    context("Testing compliance of Encrypt/Decrypt circuits: circuit to circuit", () => {
        let input_encrypt: EncryptCircuitInputs;
        let keypair: Keypair;
        let ephemeral_key: string[];
        let encrypted_message: string[];
        let message: string[];
        let encodedMessage: ExtPointType;
        let encrypt_witness: any;

        before(async () => {
            keypair = genKeypair();
            encodedMessage = genRandomPoint();
            message = toStringArray(encodedMessage);

            let encryption = genCircuitInputs(keypair, encodedMessage);
            input_encrypt = encryption.input_encrypt;
            ephemeral_key = encryption.ephemeral_key;
            encrypted_message = encryption.encrypted_message;

            encrypt_witness = await loadCircuit(encryptCircuit, input_encrypt, true);
        });

        it("Verify the message input is the same as decrypted message", async () => {
            const input_decrypt: DecryptCircuitInputs = {
                encryptedMessage: [
                    getSignalByName(encryptCircuit, encrypt_witness, "encryptedMessage[0]"),
                    getSignalByName(encryptCircuit, encrypt_witness, "encryptedMessage[1]"),
                ],
                ephemeralKey: [
                    getSignalByName(encryptCircuit, encrypt_witness, "ephemeralKey[0]"),
                    getSignalByName(encryptCircuit, encrypt_witness, "ephemeralKey[1]"),
                ],
                privateKey: formatPrivKeyForBabyJub(keypair.privKey),
            };

            const decrypt_witness = await decryptCircuit.calculateWitness(input_decrypt, true);
            await decryptCircuit.assertOut(decrypt_witness, { decryptedMessage: message });
        });

        it("Looped Verify the circuits given random inputs", async () => {
            for (let i = 0; i < 100; i++) {
                message = toStringArray(encodedMessage);
                keypair = genKeypair();

                const object = genCircuitInputs(keypair, encodedMessage);
                input_encrypt = object.input_encrypt;
                ephemeral_key = object.ephemeral_key;
                encrypted_message = object.encrypted_message;

                const encrypt_witness = await loadCircuit(encryptCircuit, input_encrypt, true);

                // The input of the decrypt circuit is given by the output of the encrypt circuit
                let input_decrypt: DecryptCircuitInputs = {
                    encryptedMessage: [
                        getSignalByName(encryptCircuit, encrypt_witness, "encryptedMessage[0]"),
                        getSignalByName(encryptCircuit, encrypt_witness, "encryptedMessage[1]"),
                    ],
                    ephemeralKey: [
                        getSignalByName(encryptCircuit, encrypt_witness, "ephemeralKey[0]"),
                        getSignalByName(encryptCircuit, encrypt_witness, "ephemeralKey[1]"),
                    ],
                    privateKey: formatPrivKeyForBabyJub(keypair.privKey),
                };

                const decrypt_witness = await loadCircuit(decryptCircuit, input_decrypt, true);
                await decryptCircuit.assertOut(decrypt_witness, { decryptedMessage: message });
            }
        });

        it("Verify the ElGamal homomorphic property of two random messages", async () => {
            const keypair = genKeypair();

            const encodedMessage1 = genRandomPoint();
            const encryption1 = genCircuitInputs(keypair, encodedMessage1);
            const input_encrypt1 = encryption1.input_encrypt;
            const encrypt1_witness = await loadCircuit(encryptCircuit, input_encrypt1, true);

            const encodedMessage2 = genRandomPoint();
            const encryption2 = genCircuitInputs(keypair, encodedMessage2);
            const input_encrypt2 = encryption2.input_encrypt;
            const encrypt2_witness = await loadCircuit(encryptCircuit, input_encrypt2, true);

            // Take the first encrypted message from the circuit output
            const encrypted_message1 = coordinatesToExtPoint(
                getSignalByName(encryptCircuit, encrypt1_witness, "encryptedMessage[0]"),
                getSignalByName(encryptCircuit, encrypt1_witness, "encryptedMessage[1]"),
            );
            // Take the second encrypted message from the circuit output
            const encrypted_message2 = coordinatesToExtPoint(
                getSignalByName(encryptCircuit, encrypt2_witness, "encryptedMessage[0]"),
                getSignalByName(encryptCircuit, encrypt2_witness, "encryptedMessage[1]"),
            );

            // Add both encrypted messages to verify the homomorphic property
            const encrypted_message3 = encrypted_message1.add(encrypted_message2);
            // Proving message is equal to the decrypted(encrypted_message3) => will prove the homomorphic property
            let message3 = encodedMessage1.add(encodedMessage2);

            // Take the first ephemeral key from the circuit output
            const ephemeral_key1 = coordinatesToExtPoint(
                getSignalByName(encryptCircuit, encrypt1_witness, "ephemeralKey[0]"),
                getSignalByName(encryptCircuit, encrypt1_witness, "ephemeralKey[1]"),
            );
            // Take the second ephemeral key from the circuit output
            const ephemeral_key2 = coordinatesToExtPoint(
                getSignalByName(encryptCircuit, encrypt2_witness, "ephemeralKey[0]"),
                getSignalByName(encryptCircuit, encrypt2_witness, "ephemeralKey[1]"),
            );

            // The ephemeral key for homomorphic decryption should be ephemeral_key1 + ephemeral_key2
            const ephemeral_key3 = ephemeral_key1.add(ephemeral_key2);

            // The input of the decrypt circuit is given by the added outputs of the encrypt circuit for message1 and message2
            const input_decrypt3: DecryptCircuitInputs = {
                encryptedMessage: toStringArray(encrypted_message3),
                ephemeralKey: toStringArray(ephemeral_key3),
                privateKey: formatPrivKeyForBabyJub(keypair.privKey),
            };

            const decrypt_witness = await loadCircuit(decryptCircuit, input_decrypt3, true);
            await decryptCircuit.assertOut(decrypt_witness, {
                decryptedMessage: toStringArray(message3),
            });
        });
    });
});
