const buildBabyjub = require("circomlibjs").buildBabyjub;
import { decode, encode, split64 } from "../../build/decode";
import { assert, expect } from "chai";
import { getRandomPoint, genKeypair, getInRange, encrypt, decrypt, encrypt_s } from "../babyJub";

const b32 = 4294967296n;

describe("Testing ElGamal Scheme on EC points directly", async () => {
    it("Check compliance of orignal and decrypted message as points", async () => {
        const keypair = await genKeypair();
        const encryption = await encrypt(keypair.public_key);
        const decrypted_message = await decrypt(
            keypair.private_key,
            encryption.ephemeral_key,
            encryption.encrypted_message,
        );
        expect(encryption.message, "Decrypted message is different!").deep.equal(decrypted_message);
    });

    it("Check unhappy compliance of orignal and decrypted message as points", async () => {
        const keypair = await genKeypair();
        let encryption = await encrypt(keypair.public_key);
        // we just need to modify any of the inputs
        encryption.encrypted_message = encryption.encrypted_message.reverse();
        const decrypted_message = decrypt(
            keypair.private_key,
            encryption.ephemeral_key,
            encryption.encrypted_message,
        );

        expect(encryption.message, "Somehting went wrong!").to.not.deep.equal(decrypted_message);
    });

    it("Check LOOPED compliance of orignal and decrypted message as points", async () => {
        for (let i = 0; i < 10; i++) {
            let keypair = await genKeypair();
            let encryption = await encrypt(keypair.public_key);
            let decrypted_message = await decrypt(
                keypair.private_key,
                encryption.ephemeral_key,
                encryption.encrypted_message,
            );

            expect(encryption.message, "Decrypted message is different!").to.deep.equal(
                decrypted_message,
            );
        }
    });

    it("Check homomorphic properties of the Elgamal Scheme", async () => {
        const keypair = await genKeypair();

        const encryption1 = await encrypt(keypair.public_key);
        const encryption2 = await encrypt(keypair.public_key);

        const babyjub = await buildBabyjub();
        // We want to prove that message3 is equal to decrypted(encryptedMessage3)
        const message3 = babyjub.addPoint(encryption1.message, encryption2.message);
        const encrypted_message3 = babyjub.addPoint(
            encryption1.encrypted_message,
            encryption2.encrypted_message,
        );
        const ephemeral_key3 = babyjub.addPoint(
            encryption1.ephemeral_key,
            encryption2.ephemeral_key,
        );
        const decrypted_message3 = await decrypt(
            keypair.private_key,
            ephemeral_key3,
            encrypted_message3,
        );

        expect(decrypted_message3, "Invalid linear homomorphism!").to.deep.equal(message3);
    });

    it("Check unhappy homomorphic properties for wrong inputs", async () => {
        const keypair = await genKeypair();

        const encryption1 = await encrypt(keypair.public_key);
        const encryption2 = await encrypt(keypair.public_key);

        const babyjub = await buildBabyjub();
        // We want to prove that message3 is not equal to decrypted(encryptedMessage3)
        const message3 = babyjub.addPoint(encryption1.message, encryption2.message);
        const encrypted_message3 = babyjub.addPoint(
            encryption1.encrypted_message,
            encryption2.encrypted_message,
        );
        // we modify ephemeral_key3 for this example
        const ephemeral_key3 = babyjub
            .addPoint(encryption1.ephemeral_key, encryption2.ephemeral_key)
            .reverse();
        const decrypted_message3 = await decrypt(
            keypair.private_key,
            ephemeral_key3,
            encrypted_message3,
        );

        expect(decrypted_message3, "Something went wrong!").to.not.deep.equal(message3);
    });
});

describe.skip("Testing Encoding/Decoding for ElGamal Scheme", async () => {
    it("Check encoding a plain text bigger than 32 bits returns error", () => {
        const plaintext = getInRange(b32 * 2n, b32 ** 2n);
        let expected = Error;
        const exercise = () => encode(plaintext);
        assert.throws(exercise, expected);
    });

    it("Check compliance of orignal and decoded message as 32-bit numbers", () => {
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const decoded = decode(encoded, 19);

        assert(plaintext === decoded, "Decoded number is different!");
    });

    it("Check unhappy compliance of orignal and decoded message for a different random input", async () => {
        const plaintext = getInRange(1n, b32);
        const encoded = encode(plaintext);
        const rand = await getRandomPoint();
        const decoded = decode(encoded, 19);
        const decoded_rand = decode(rand, 19);

        assert(plaintext === decoded && decoded !== decoded_rand, "Something went different!");
    });

    it("Check LOOPED compliance of orignal and decoded message as 32-bit numbers", () => {
        for (let i = 0; i < 15; i++) {
            let plaintext = getInRange(1n, b32);
            let encoded = encode(plaintext);
            let decoded = decode(encoded, 19);

            assert(plaintext === decoded, "Decoded number is different!");
        }
    });

    it("Check decoding preserves Elgamal linear homomorphism", async () => {
        // The input should be a 64-bit number
        const input = getInRange(1n, b32 ** 2n);

        // the initial input is split into two 32-bit numbers for faster decoding
        const [xlo, xhi] = split64(input);

        const M1 = encode(xlo);
        const M2 = encode(xhi);

        const keypair = await genKeypair();

        const encryption1 = await encrypt_s(M1, keypair.public_key);
        const encryption2 = await encrypt_s(M2, keypair.public_key);

        const decrypted_message1 = await decrypt(
            keypair.private_key,
            encryption1.ephemeral_key,
            encryption1.encrypted_message,
        );
        const decrypted_message2 = await decrypt(
            keypair.private_key,
            encryption2.ephemeral_key,
            encryption2.encrypted_message,
        );

        const dlo = decode(decrypted_message1, 19);
        const dhi = decode(decrypted_message2, 19);

        const decoded_input = dlo + b32 * dhi;

        assert(decoded_input === input, "decoding led to different result!");
    });

    it("Check unhappy decoding breaks Elgamal linear homomorphism", async () => {
        // The input should be a 64-bit number
        const input = getInRange(1n, b32 ** 2n);

        // the initial input is split into two 32-bit numbers for faster decoding
        const [xlo, xhi] = split64(input);

        // we swap xlo and xhi to mess with the decoding
        const M1 = encode(xhi);
        const M2 = encode(xlo);

        const keypair = await genKeypair();

        const encryption1 = await encrypt_s(M1, keypair.public_key);
        const encryption2 = await encrypt_s(M2, keypair.public_key);

        const decrypted_message1 = await decrypt(
            keypair.private_key,
            encryption1.ephemeral_key,
            encryption1.encrypted_message,
        );
        const decrypted_message2 = await decrypt(
            keypair.private_key,
            encryption2.ephemeral_key,
            encryption2.encrypted_message,
        );

        const dlo = decode(decrypted_message1, 19);
        const dhi = decode(decrypted_message2, 19);

        const decoded_input = dlo + b32 * dhi;

        assert(decoded_input !== input, "decoding led to different result!");
    });

    it("Check LOOPED decoding preserves Elgamal linear homomorphism", async () => {
        for (let i = 0; i < 10; i++) {
            // The input should be a 64-bit number
            let input = getInRange(1n, b32 ** 2n);

            // the initial input is split into two 32-bit numbers for faster decoding
            let [xlo, xhi] = split64(input);

            let M1 = encode(xlo);
            let M2 = encode(xhi);

            let keypair = await genKeypair();

            const encryption1 = await encrypt_s(M1, keypair.public_key);
            const encryption2 = await encrypt_s(M2, keypair.public_key);

            const decrypted_message1 = await decrypt(
                keypair.private_key,
                encryption1.ephemeral_key,
                encryption1.encrypted_message,
            );
            const decrypted_message2 = await decrypt(
                keypair.private_key,
                encryption2.ephemeral_key,
                encryption2.encrypted_message,
            );

            const dlo = decode(decrypted_message1, 19);
            const dhi = decode(decrypted_message2, 19);

            const decoded_input = dlo + b32 * dhi;

            assert(decoded_input === input, "decoding led to different result!");
        }
    });
});
