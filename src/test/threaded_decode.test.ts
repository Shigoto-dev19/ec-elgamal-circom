import { decode, encode, split64 } from "../../build/decode";
import { getRandomPoint, genKeypair, getInRange, encrypt, decrypt, encrypt_s } from "../babyJub";

const fs = require('fs');
const { decode_threaded_VLT } = require('../../build/threader.js');
const assert = require('chai').assert; 

const b32 = 4294967296n;
const lookupTable = JSON.parse(fs.readFileSync(`./lookupTables/x19xlookupTable.json`));

describe("Testing Encoding/Decoding for ElGamal Scheme", () => {

    it.only("Check compliance of orignal and THREAD-decoded message as 32-bit numbers", () => {
        
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        let decoded_result;
        decode_threaded_VLT(encoded, 19, 2, lookupTable) 
            .then((decoded) => {
                decoded_result = decoded
                assert(plaintext === decoded, "Decoded number is different!");
        })
            .catch((err) => {
                console.error(err);
                throw new Error('Error in decode_threaded_VLT');
        });
        console.log(plaintext);
        console.log(decoded_result);
        
    });

    it.skip("Check unhappy compliance of orignal and THREAD-decoded message for a different random input", async () => {
        
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const rand = await getRandomPoint();
        
        decode_threaded_VLT(encoded, 19, 2, lookupTable)
            .then((decoded) => {
                decode_threaded_VLT(rand, 19, 2, lookupTable)
                    .then((decoded_rand) => {
                        assert(plaintext === decoded && decoded !== decoded_rand, "Something went different!");
                })
                .catch((err) => {
                    console.error(err);
                });
            })
            .catch((err) => {
                console.error(err);
            });
    });

    it("Check LOOPED compliance of orignal and THREAD-decoded message as 32-bit numbers", () => {
        
        for (let i=0; i<15; i++) {

            const plaintext = getInRange(1n, b32);
            const encoded = encode(plaintext);
            decode_threaded_VLT(encoded, 19, 2, lookupTable) 
                .then((decoded) => {
                    assert(plaintext === decoded, "Decoded number is different!");
            })
                .catch((err) => {
                    console.error(err);
            });
        }   
    });

    it("Check decoding preserves Elgamal linear homomorphism", async() => {

        // The input should be a 64-bit number
        const input = getInRange(1n, b32**2n);                          
        
        // the initial input is split into two 32-bit numbers for faster decoding 
        const [xlo, xhi] = split64(input);
        
        const M1 = encode(xlo);
        const M2 = encode(xhi);
        
        const keypair = await genKeypair();

        const encryption1 = await encrypt_s(M1, keypair.public_key);
        const encryption2 = await encrypt_s(M2, keypair.public_key);

        const Md1 = await decrypt(keypair.private_key,  encryption1.ephemeral_key, encryption1.encrypted_message);
        const Md2 = await decrypt(keypair.private_key,  encryption2.ephemeral_key, encryption2.encrypted_message);

        decode_threaded_VLT(Md1, 19, 2, lookupTable)
        .then((dlo) => {
            decode_threaded_VLT(Md2, 19, 2, lookupTable)
                .then((dhi) => {
                    
                    const decoded_input = dlo + b32 * dhi;
                    assert(decoded_input !== input, "decoding led to different result!")
            })
            .catch((err) => {
                console.error(err);
            });
        })
        .catch((err) => {
            console.error(err);
        });

    });

    it("Check unhappy decoding breaks Elgamal linear homomorphism", async() => {

        // The input should be a 64-bit number
        const input = getInRange(1n, b32**2n);                          
        
        // the initial input is split into two 32-bit numbers for faster decoding 
        const [xlo, xhi] = split64(input);
        
        // we swap xlo and xhi to mess with the decoding
        const M1 = encode(xhi);
        const M2 = encode(xlo);
        
        const keypair = await genKeypair();

        const encryption1 = await encrypt_s(M1, keypair.public_key);
        const encryption2 = await encrypt_s(M2, keypair.public_key);

        const Md1 = await decrypt(keypair.private_key,  encryption1.ephemeral_key, encryption1.encrypted_message);
        const Md2 = await decrypt(keypair.private_key,  encryption2.ephemeral_key, encryption2.encrypted_message);

        decode_threaded_VLT(Md1, 19, 2, lookupTable)
            .then((dlo) => {
                decode_threaded_VLT(Md2, 19, 2, lookupTable)
                    .then((dhi) => {
                    
                        const decoded_input = dlo + b32 * dhi;
                        assert(decoded_input !== input, "decoding led to different result!")
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
                .catch((err) => {
                    console.error(err);
            });
        
    });

    it("Check LOOPED THREAD-decoding preserves Elgamal linear homomorphism", async () => {

        for (let i=0; i<10; i++) {
            // The input should be a 64-bit number
            let input = getInRange(1n, b32**2n);                          
            
            // the initial input is split into two 32-bit numbers for faster decoding 
            let [xlo, xhi] = split64(input);
            
            let M1 = encode(xlo);
            let M2 = encode(xhi);
            
            const keypair = await genKeypair();

            const encryption1 = await encrypt_s(M1, keypair.public_key);
            const encryption2 = await encrypt_s(M2, keypair.public_key);
    
            const Md1 = await decrypt(keypair.private_key,  encryption1.ephemeral_key, encryption1.encrypted_message);
            const Md2 = await decrypt(keypair.private_key,  encryption2.ephemeral_key, encryption2.encrypted_message);

            decode_threaded_VLT(Md1, 19, 2, lookupTable)
                .then((dlo) => {
                    decode_threaded_VLT(Md2, 19, 2, lookupTable)
                        .then((dhi) => {
                    
                            const decoded_input = dlo + b32 * dhi;
                            assert(decoded_input !== input, "decoding led to different result!")
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
        }        
    });

});