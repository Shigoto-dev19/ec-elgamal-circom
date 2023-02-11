import { getRandomPoint, getInRange } from "../elgamal";
import { encrypt_s, encrypt, decrypt, key_pair } from "../elgamal";
import { bn254 } from '../noble_bn254';
import { decode, encode, split64 } from '../decode';

const assert = require('chai').assert; 

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;
const b32 = 4294967296n;

describe("Testing Encoding/Decoding for ElGamal Scheme", () => {

    it("Check encoding a plain text bigger than 32 bits returns error", () => {
        
        const plaintext = getInRange(b32*2n, b32**2n);
        let expected = Error;
        const exercise = () => encode(plaintext);
        assert.throws(exercise, expected);
    });

    it("Check compliance of orignal and decrypted message as points", () => {
        
        const [private_key, public_key] = key_pair();
        const [M, ephemeral_key, encrypted_message] = encrypt(public_key);
        const Md = decrypt(private_key,  ephemeral_key, encrypted_message);
        assert(M.equals(Md),'Decrypted message is different!');

    });

    it("Check unhappy compliance of orignal and decrypted message as points", () => {
        
        const [private_key, public_key] = key_pair();
        let [M, ephemeral_key, encrypted_message] = encrypt(public_key);
        // we just need to modify any of the inputs
        encrypted_message = encrypted_message.add(G);
        const Md = decrypt(private_key,  ephemeral_key, encrypted_message);
          
        assert(!M.equals(Md),'Somehting went wrong!');

    });

    it("Check LOOPED compliance of orignal and decrypted message as points", () => {
        
        for (let i=0; i<1000; i++) {

            let [private_key, public_key] = key_pair();
            let [M, ephemeral_key, encrypted_message] = encrypt(public_key);
            let Md = decrypt(private_key,  ephemeral_key, encrypted_message);
            
            assert(M.equals(Md),'Decrypted message is different!');
        }    
    });

    it("Check homomorphic properties of the Elgamal Scheme", () => {

        const [private_key, public_key] = key_pair();

        const [M1, ephemeral_key1, encrypted_message1] = encrypt(public_key);
        const [M2, ephemeral_key2, encrypted_message2] = encrypt(public_key);
       
        // We want to prove that M3 is equal to decrypted(encryptedMessage3)
        const M3 = M1.add(M2);
        const encrypted_message3 = encrypted_message1.add(encrypted_message2);  
        const ephemeral_key3 = ephemeral_key1.add(ephemeral_key2);
        const dM3 = decrypt(private_key,  ephemeral_key3, encrypted_message3);    

        assert(dM3.equals(M3), "Invalid linear homomorphism!");
      
    });

    it("Check unhappy homomorphic properties for wrong inputs", () => {

        const [private_key, public_key] = key_pair();

        const [M1, ephemeral_key1, encrypted_message1] = encrypt(public_key);
        const [M2, ephemeral_key2, encrypted_message2] = encrypt(public_key);
       
        // We want to prove that M3 is not equal to decrypted(encryptedMessage3)
        const M3 = M1.add(M2);
        const encrypted_message3 = encrypted_message1.add(encrypted_message2);
        // we modify ephemeral_key for this example  
        const ephemeral_key3 = ephemeral_key1.add(ephemeral_key2).add(G);
        const dM3 = decrypt(private_key,  ephemeral_key3, encrypted_message3);    

        assert(!dM3.equals(M3), "Something went wrong!");
      
    });

    it("Check compliance of orignal and decoded message as 32-bit numbers", () => {
        
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const decoded = decode(encoded,19);
        
        assert(plaintext === decoded, "Decoded number is different!");
    });

    it("Check unhappy compliance of orignal and decoded message for a different random input", () => {
        
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const rand = G.multiplyUnsafe(getInRange(1n, b32));
        const decoded = decode(encoded,19);
        const decoded_rand = decode(rand,19);
        
        assert(plaintext === decoded && decoded !== decoded_rand, "Something went different!");
    });

    it("Check LOOPED compliance of orignal and decoded message as 32-bit numbers", () => {
        
        for (let i=0; i<15; i++) {

            let plaintext = getInRange(1n, b32);
            let encoded = encode(plaintext);
            let decoded = decode(encoded,19);
            
            assert(plaintext === decoded, "Decoded number is different!");
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

        const dlo = decode(Md1, 19);
        const dhi = decode(Md2, 19);

        const decoded_input = dlo + b32 * dhi;

        assert(decoded_input === input, "decoding led to different result!")

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

        const dlo = decode(Md1, 19);
        const dhi = decode(Md2, 19);

        const decoded_input = dlo + b32 * dhi;

        assert(decoded_input !== input, "decoding led to different result!");

    });

    it("Check LOOPED decoding preserves Elgamal linear homomorphism", () => {

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

            let dlo = decode(Md1, 19);
            let dhi = decode(Md2, 19);

            const decoded_input = dlo + b32 * dhi;

            assert(decoded_input === input, "decoding led to different result!");
        }        
    });
});    