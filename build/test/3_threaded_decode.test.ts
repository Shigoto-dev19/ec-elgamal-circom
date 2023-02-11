import { getRandomPoint, getInRange } from "../elgamal";
import { encrypt_s, encrypt, decrypt, key_pair } from "../elgamal";
import { bn254 } from '../noble_bn254';
import { decode, encode, split64 } from '../decode';
const fs = require('fs');
const { decode_threaded_VLT } = require('../threader.js');
const assert = require('chai').assert; 

const Point = bn254.ProjectivePoint; 
const G = Point.BASE; 
const b32 = 4294967296n;
const lookupTable = JSON.parse(fs.readFileSync(`./lookupTables/x19xlookupTable.json`));

describe("Testing Encoding/Decoding for ElGamal Scheme", () => {

    it("Check compliance of orignal and THREAD-decoded message as 32-bit numbers", () => {
        
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        
        decode_threaded_VLT(encoded, 19, 2, lookupTable) 
            .then((decoded) => {
                assert(plaintext == decoded, "Decoded number is different!");
                console.log(plaintext);
                console.log(decoded);
        })
            .catch((err) => {
                console.error(err);
                throw new Error('Error in decode_threaded_VLT');
        });
        
    });

    it("Check unhappy compliance of orignal and THREAD-decoded message for a different random input", async () => {
        

        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const rand = G.multiplyUnsafe(getInRange(1n, b32));
        
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

    it("Check decoding preserves Elgamal linear homomorphism", () => {

        // The input should be a 64-bit number
        const input = getInRange(1n, b32**2n);                          
        
        // the initial input is split into two 32-bit numbers for faster decoding 
        const [xlo, xhi] = split64(input);
        
        const M1 = encode(xlo);
        const M2 = encode(xhi);
        
        const [private_key, public_key] = key_pair();

        const [ephemeral_key1, encrypted_message1] = encrypt_s(M1, public_key);
        const [ephemeral_key2, encrypted_message2] = encrypt_s(M2, public_key);

        const Md1 = decrypt(private_key,  ephemeral_key1, encrypted_message1);
        const Md2 = decrypt(private_key,  ephemeral_key2, encrypted_message2);

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

    it("Check unhappy decoding breaks Elgamal linear homomorphism", () => {

        // The input should be a 64-bit number
        const input = getInRange(1n, b32**2n);                          
        
        // the initial input is split into two 32-bit numbers for faster decoding 
        const [xlo, xhi] = split64(input);
        
        // we swap xlo and xhi to mess with the decoding
        const M1 = encode(xhi);
        const M2 = encode(xlo);
        
        const [private_key, public_key] = key_pair();

        const [ephemeral_key1, encrypted_message1] = encrypt_s(M1, public_key);
        const [ephemeral_key2, encrypted_message2] = encrypt_s(M2, public_key);

        const Md1 = decrypt(private_key,  ephemeral_key1, encrypted_message1);
        const Md2 = decrypt(private_key,  ephemeral_key2, encrypted_message2);

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

    it("Check LOOPED THREAD-decoding preserves Elgamal linear homomorphism", () => {

        for (let i=0; i<10; i++) {
            // The input should be a 64-bit number
            let input = getInRange(1n, b32**2n);                          
            
            // the initial input is split into two 32-bit numbers for faster decoding 
            let [xlo, xhi] = split64(input);
            
            let M1 = encode(xlo);
            let M2 = encode(xhi);
            
            let [private_key, public_key] = key_pair();

            let [ephemeral_key1, encrypted_message1] = encrypt_s(M1, public_key);
            let [ephemeral_key2, encrypted_message2] = encrypt_s(M2, public_key);

            let Md1 = decrypt(private_key,  ephemeral_key1, encrypted_message1);
            let Md2 = decrypt(private_key,  ephemeral_key2, encrypted_message2);

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