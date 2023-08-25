const snarkjs = require('snarkjs');
const fs = require('fs');
const expect = require("chai").expect;
const buildBabyjub = require("circomlibjs").buildBabyjub;

import { 
    genKeypair,
    getInRange,
    encrypt,
    decrypt,
 } from "../src/babyJub";

const wasm_path_encrypt = "./circuits/artifacts/encrypt_test/encrypt.wasm";
const zkey_path_encrypt = "./circuits/artifacts/encrypt_test/encrypt.zkey";

const wasm_path_decrypt = "./circuits/artifacts/decrypt_test/decrypt.wasm";
const zkey_path_decrypt = "./circuits/artifacts/decrypt_test/decrypt.zkey";

describe('Testing ElGamal Scheme Circuits\n', () => {

    context('Testing Encrypt Circuit', () => {
        let babyJub;
        let Fr;
        let input;
        let keypair;
        let encryption;
    
        before( async() => {
            babyJub = await buildBabyjub();
            Fr = babyJub.F;
            
            keypair = await genKeypair();
            encryption = await encrypt(keypair.public_key);
            input = {
                "M": encryption.message.map(x => Fr.toString(x)),
                "k": encryption.nonce.toString(),
                "pk": keypair.public_key.map(x => Fr.toString(x)),  
            }
        });
    
        it('Verify Encrypt circuit', async() => {

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_encrypt, zkey_path_encrypt);  
            const vKey = JSON.parse(fs.readFileSync("./circuits/artifacts/encrypt_test/encrypt.vkey.json"));
            
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            expect(res).to.equal(true);    

        });

        it("Verify compliant encrypt output", async() => {
          
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_encrypt, zkey_path_encrypt);  
            // Verify compliant encryption output for the ephemeral key
            expect(publicSignals[0]).to.equals(Fr.toString(encryption.ephemeral_key[0]));
            expect(publicSignals[1]).to.equals(Fr.toString(encryption.ephemeral_key[1]));
            // Verify compliant encryption output for the encrypted message
            expect(publicSignals[2]).to.equals(Fr.toString(encryption.encrypted_message[0]));
            expect(publicSignals[3]).to.equals(Fr.toString(encryption.encrypted_message[1]));
            // Verify compliant encryption input for public key
            expect(publicSignals[4]).to.equals(input.pk[0]);
            expect(publicSignals[5]).to.equals(input.pk[1]);    
        });

        it("Verify false encrypt output is invalid", async() => {
            
            input.k = getInRange(1n, babyJub.order).toString();
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_encrypt, zkey_path_encrypt);  
            
            // Verify compliant encryption output for the ephemeral key
            expect(publicSignals[0]).to.not.equals(Fr.toString(encryption.ephemeral_key[0]));
            expect(publicSignals[1]).to.not.equals(Fr.toString(encryption.ephemeral_key[1]));
            // Verify compliant encryption output for the encrypted message
            expect(publicSignals[2]).to.not.equals(Fr.toString(encryption.encrypted_message[0]));
            expect(publicSignals[3]).to.not.equals(Fr.toString(encryption.encrypted_message[1]));
            // Verify compliant encryption input for public key
            expect(publicSignals[4]).to.equals(input.pk[0]);
            expect(publicSignals[5]).to.equals(input.pk[1]);
            
        });


        it("Looped: Verify compliant encrypt output for random inputs", async() => {
            
            for (let i=0; i<5; i++) {
                keypair = await genKeypair();
                encryption = await encrypt(keypair.public_key);
                input = {
                    "M": encryption.message.map(x => Fr.toString(x)),
                    "k": encryption.nonce.toString(),
                    "pk": keypair.public_key.map(x => Fr.toString(x)),  
                }
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_encrypt, zkey_path_encrypt);  
                // Verify compliant encryption output for the ephemeral key
                expect(publicSignals[0]).to.equals(Fr.toString(encryption.ephemeral_key[0]));
                expect(publicSignals[1]).to.equals(Fr.toString(encryption.ephemeral_key[1]));
                // Verify compliant encryption output for the encrypted message
                expect(publicSignals[2]).to.equals(Fr.toString(encryption.encrypted_message[0]));
                expect(publicSignals[3]).to.equals(Fr.toString(encryption.encrypted_message[1]));
                // Verify compliant encryption input for public key
                expect(publicSignals[4]).to.equals(input.pk[0]);
                expect(publicSignals[5]).to.equals(input.pk[1]);
                
            }   
        });
    })


    context('Testing Decrypt Circuit', () => {
        let babyJub;
        let Fr;
        let input;
        let keypair;
        let encryption;
        let decrypted_message;
    
        before( async() => {
            babyJub = await buildBabyjub();
            Fr = babyJub.F;
            
            keypair = await genKeypair();
            encryption = await encrypt(keypair.public_key);
            decrypted_message = decrypt(
                keypair.private_key, 
                encryption.ephemeral_key,
                encryption.encrypted_message
            );
            input = {
                "eM": encryption.encrypted_message.map(x => Fr.toString(x)),
                "ke": encryption.ephemeral_key.map(x => Fr.toString(x)),
                "d": keypair.private_key.toString(),  
            }
        });
    
        it('Verify Decrypt circuit', async() => {

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_decrypt, zkey_path_decrypt);  
            const vKey = JSON.parse(fs.readFileSync("./circuits/artifacts/decrypt_test/decrypt.vkey.json"));
            
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            expect(res).to.equal(true);    

        });

        it("Verify compliant decrypt output", async() => {
      
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_decrypt, zkey_path_decrypt);  
            
            // Verify compliant decryption output of the decrypted message
            expect(publicSignals[0]).to.equals(Fr.toString(encryption.message[0]));
            expect(publicSignals[1]).to.equals(Fr.toString(encryption.message[1]));
            
            // Verify compliant decryption input for the encrypted message
            expect(publicSignals[2]).to.equals(Fr.toString(encryption.encrypted_message[0]));
            expect(publicSignals[3]).to.equals(Fr.toString(encryption.encrypted_message[1]));  
        });

        it("Verify false decrypt output is invalid", async() => {
            
            // only modify the private key 
            input.d = getInRange(1n, babyJub.order).toString();
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_decrypt, zkey_path_decrypt);  
            
            // Verify compliant decryption output of the decrypted message
            expect(publicSignals[0]).to.not.equals(Fr.toString(encryption.message[0]));
            expect(publicSignals[1]).to.not.equals(Fr.toString(encryption.message[1]));
            
            // Verify compliant decryption input for the encrypted message
            expect(publicSignals[2]).to.equals(Fr.toString(encryption.encrypted_message[0]));
            expect(publicSignals[3]).to.equals(Fr.toString(encryption.encrypted_message[1]));
            
        });

        it("Looped: Verify compliant decrypt output for random inputs", async() => {
            
            for (let i=0; i<5; i++) {

                keypair = await genKeypair();
                encryption = await encrypt(keypair.public_key);
                decrypted_message = decrypt(
                    keypair.private_key, 
                    encryption.ephemeral_key,
                    encryption.encrypted_message
                );
                input = {
                    "eM": encryption.encrypted_message.map(x => Fr.toString(x)),
                    "ke": encryption.ephemeral_key.map(x => Fr.toString(x)),
                    "d": keypair.private_key.toString(),  
                }

                const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path_decrypt, zkey_path_decrypt);  
            
                // Verify compliant decryption output of the decrypted message
                expect(publicSignals[0]).to.equals(Fr.toString(encryption.message[0]));
                expect(publicSignals[1]).to.equals(Fr.toString(encryption.message[1]));
                
                // Verify compliant decryption input for the encrypted message
                expect(publicSignals[2]).to.equals(Fr.toString(encryption.encrypted_message[0]));
                expect(publicSignals[3]).to.equals(Fr.toString(encryption.encrypted_message[1]));  
                }
        });
    })
        
    context('Testing compliance of Encrypt/Decrypt circuits: circuit to circuit', () => {
        let babyJub;
        let Fr;
        let input_encrypt;
        let keypair;
        let encryption;
        let decrypted_message;

        before( async() => {
            babyJub = await buildBabyjub();
            Fr = babyJub.F;
            
            keypair = await genKeypair();
            encryption = await encrypt(keypair.public_key);
            decrypted_message = decrypt(
                keypair.private_key, 
                encryption.ephemeral_key,
                encryption.encrypted_message
            );
            input_encrypt = {
                "M": encryption.message.map(x => Fr.toString(x)),
                "k": encryption.nonce.toString(),
                "pk": keypair.public_key.map(x => Fr.toString(x)),  
            }
        });
    
        it("Verify the message input is the same as decrypted message", async () => {

            const prove_encrypt = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
            const publicSignals_encrypt = prove_encrypt.publicSignals;
            
            const input_decrypt = {
                "eM" : [publicSignals_encrypt[2], publicSignals_encrypt[3]],
                "ke" : [publicSignals_encrypt[0], publicSignals_encrypt[1]],
                "d"  : keypair.private_key.toString()
            };
            
            const prove_decrypt = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);
            const publicSignals_decrypt = prove_decrypt.publicSignals;

            expect(publicSignals_decrypt[0]).to.equals(input_encrypt.M[0]);
            expect(publicSignals_decrypt[1]).to.equals(input_encrypt.M[1]);
        })

        it("Looped Verify the circuits given random inputs", async () => {
            
            for (let i=0; i<10; i++) {

                keypair = await genKeypair();
                encryption = await encrypt(keypair.public_key);
                decrypted_message = decrypt(
                    keypair.private_key, 
                    encryption.ephemeral_key,
                    encryption.encrypted_message
                );
                input_encrypt = {
                    "M": encryption.message.map(x => Fr.toString(x)),
                    "k": encryption.nonce.toString(),
                    "pk": keypair.public_key.map(x => Fr.toString(x)),  
                }
                const prove_encrypt = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                const publicSignals_encrypt = prove_encrypt.publicSignals;

                // The input of the decrypt circuit is given by the output of the encrypt circuit
                let input_decrypt = {
                    "eM" : [publicSignals_encrypt[2], publicSignals_encrypt[3]],
                    "ke" : [publicSignals_encrypt[0], publicSignals_encrypt[1]],
                    "d"  : keypair.private_key.toString()
                };
                
                const prove_decrypt = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);
                const publicSignals_decrypt = prove_decrypt.publicSignals;

                expect(publicSignals_decrypt[0]).to.equals(input_encrypt.M[0]);
                expect(publicSignals_decrypt[1]).to.equals(input_encrypt.M[1]);
            }
        })

        it("Verify the ElGamal homomorphic property of two random messages", async () => {

            const keypair = await genKeypair();
            const encryption1 = await encrypt(keypair.public_key);  // encrypt message M1 with the same public key
            const encryption2 = await encrypt(keypair.public_key);  // encrypt message M2 with the same public key 
            
            // the input for the encrypt circuit is given randomly by the TS code 
            const input_encrypt1 = {
                "M": encryption1.message.map(x => Fr.toString(x)),
                "k": encryption1.nonce.toString(),
                "pk": keypair.public_key.map(x => Fr.toString(x)),  
            }

            const input_encrypt2 = {
                "M": encryption2.message.map(x => Fr.toString(x)),
                "k": encryption2.nonce.toString(),
                "pk": keypair.public_key.map(x => Fr.toString(x)),  
            }

            const prove_encrypt1 = await snarkjs.groth16.fullProve(input_encrypt1, wasm_path_encrypt, zkey_path_encrypt);
            const publicSignals_encrypt1 = prove_encrypt1.publicSignals;
            const prove_encrypt2 = await snarkjs.groth16.fullProve(input_encrypt2, wasm_path_encrypt, zkey_path_encrypt);
            const publicSignals_encrypt2 = prove_encrypt2.publicSignals;
            
            
            const eM1 = [publicSignals_encrypt1[2], publicSignals_encrypt1[3]].map(x => Fr.e(x));   // Take the encrypted message ,eM1 from the circuit output
            const eM2 = [publicSignals_encrypt2[2], publicSignals_encrypt2[3]].map(x => Fr.e(x));   // Take the encrypted message ,eM2 from the circuit output   
            
            // Add both encrypted messages to verify the homomorphic property
            const encrypted_message3 = babyJub.addPoint(eM1, eM2);     
            // Proving M3 = the decrypted eM3 will prove the homomorphic property                      
            const message3 = babyJub.addPoint(encryption1.message, encryption2.message);             
                                                                                                                                                      
            const ephemeral_key1 = [publicSignals_encrypt1[0], publicSignals_encrypt1[1]].map(x => Fr.e(x));   // Take the ephemeral key ke1 ,from the circuit output
            const ephemeral_key2 = [publicSignals_encrypt2[0], publicSignals_encrypt2[1]].map(x => Fr.e(x));   // Take the ephemeral key ke2 ,from the circuit output 
            // The ephemeral key for homomorphic decryption should be ke1+ke2 
            const ephemeral_key3 = babyJub.addPoint(ephemeral_key1, ephemeral_key2);                                                                           

            // The input of the decrypt circuit is given by the added outputs of the encrypt circuit for M1 and M2
            const input_decrypt3 = {
                "eM" : encrypted_message3.map(x => Fr.toString(x)),
                "ke" : ephemeral_key3.map(x => Fr.toString(x)),
                "d"  : keypair.private_key.toString(),
            };    
            
            const prove_decrypt = await snarkjs.groth16.fullProve(input_decrypt3, wasm_path_decrypt, zkey_path_decrypt);
            const publicSignals_decrypt3 = prove_decrypt.publicSignals;
            
            expect(publicSignals_decrypt3[0]).to.equals(Fr.toString(message3[0]));
            expect(publicSignals_decrypt3[1]).to.equals(Fr.toString(message3[1]));
        })
    })
});