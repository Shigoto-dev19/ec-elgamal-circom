import { decode, encode, split64 } from "../../utils/decode";
import { assert, expect } from "chai";
import { babyJub, genRandomPoint, genKeypair, genRandomSalt, encrypt, decrypt, rerandomize} from "..";
import { getSignalByName, stringifyBigInts, toBigIntArray, toStringArray, formatPrivKeyForBabyJub } from '../../utils/tools';

const b32 = 4294967296n;

describe("Testing ElGamal Scheme on EC points directly", () => {
    it("Check compliance of orignal and decrypted message as points", () => {
        const keypair = genKeypair();
        const encryption = encrypt(keypair.pubKey);
        const decrypted_message = decrypt(
            keypair.privKey,
            encryption.ephemeral_key,
            encryption.encrypted_message,
        );
        expect(encryption.message.toAffine(), "Decrypted message is different!").deep.equal(decrypted_message.toAffine());
    });

    it("Check unhappy compliance of orignal and decrypted message as points", () => {
        const keypair = genKeypair();
        let encryption = encrypt(keypair.pubKey);
        // we just need to modify any of the inputs
        const { randomized_ephemeralKey } = rerandomize(keypair.pubKey, encryption.ephemeral_key, encryption.encrypted_message);
        const decrypted_message = decrypt(
            keypair.privKey,
            randomized_ephemeralKey,
            encryption.encrypted_message,
        );

        expect(encryption.message.toAffine(), "Somehting went wrong!").to.not.deep.equal(decrypted_message.toAffine());
    });

    it("Check LOOPED compliance of orignal and decrypted message as points", () => {
        for (let i = 0; i < 100; i++) {
            let keypair = genKeypair();
            let encryption = encrypt(keypair.pubKey);
            let decrypted_message = decrypt(
                keypair.privKey,
                encryption.ephemeral_key,
                encryption.encrypted_message,
            );

            expect(encryption.message.toAffine(), "Decrypted message is different!").to.deep.equal(
                decrypted_message.toAffine(),
            );
        }
    });

    it("Check homomorphic properties of the Elgamal Scheme", () => {
        const keypair = genKeypair();

        const encryption1 = encrypt(keypair.pubKey);
        const encryption2 = encrypt(keypair.pubKey);

        // We want to prove that message3 is equal to decrypted(encryptedMessage3)
        const message3 = encryption1.message.add(encryption2.message);
        const encrypted_message3 = encryption1.encrypted_message.add(encryption2.encrypted_message);
        const ephemeral_key3 = encryption1.ephemeral_key.add(encryption2.ephemeral_key);

        const decrypted_message3 = decrypt(
            keypair.privKey,
            ephemeral_key3,
            encrypted_message3,
        );

        expect(decrypted_message3.toAffine(), "Invalid linear homomorphism!").to.deep.equal(message3.toAffine());
    });

    it("Check unhappy homomorphic properties for wrong inputs", () => {
        const keypair = genKeypair();

        const encryption1 = encrypt(keypair.pubKey);
        const encryption2 = encrypt(keypair.pubKey);

        const message3 = encryption1.message.add(encryption2.message);
        const encrypted_message3 = encryption1.encrypted_message.add(encryption2.encrypted_message);
        // we only modifiy ephemeral_key3 in this example
        const ephemeral_key3 = encryption1.ephemeral_key.add(babyJub.BASE);

        const decrypted_message3 = decrypt(
            keypair.privKey,
            ephemeral_key3,
            encrypted_message3,
        );

        expect(decrypted_message3.toAffine(), "Invalid linear homomorphism!").to.not.deep.equal(message3.toAffine());
    });
});

// TODO: add benchmark for old decode function => keep it to compare to the optimized version
// describe.only("Testing Encoding/Decoding for ElGamal Scheme", async () => {
//     it.skip("Check encoding a plain text bigger than 32 bits returns error", () => {
//         const plaintext = getInRange(b32 * 2n, b32 ** 2n);
//         let expected = Error;
//         const exercise = () => encode(plaintext);
//         assert.throws(exercise, expected);
//     });

//     it("Check compliance of orignal and decoded message as 32-bit numbers", async () => {
//         const plaintext = genRandomSalt();
//         const encoded = await encode(plaintext);
//         const decoded = await decode(encoded, 19);

//         assert(plaintext === decoded, "Decoded number is different!");
//     });

//     it.skip("Check unhappy compliance of orignal and decoded message for a different random input", async () => {
//         const plaintext = genRandomSalt();
//         const encoded = await encode(plaintext);
//         const rand = genRandomPoint();
//         const decoded = await decode(encoded, 19);
//         const decoded_rand = await decode(rand, 19);

//         assert(plaintext === decoded && decoded !== decoded_rand, "Something went different!");
//     });

//     it("Check LOOPED compliance of orignal and decoded message as 32-bit numbers", async () => {
//         for (let i = 0; i < 15; i++) {
//             let plaintext = genRandomSalt();
//             let encoded = await encode(plaintext);
//             let decoded = await decode(encoded, 19);

//             assert(plaintext === decoded, "Decoded number is different!");
//         }
//     });

//     it("Check decoding preserves Elgamal linear homomorphism", async () => {
//         // The input should be a 64-bit number
//         const input = getInRange(1n, b32 ** 2n);

//         // the initial input is split into two 32-bit numbers for faster decoding
//         const [xlo, xhi] = split64(input);

//         const M1 = await encode(xlo);
//         const M2 = await encode(xhi);

//         const keypair = await genKeypair();

//         const encryption1 = await encrypt_s(M1, keypair.pubKey);
//         const encryption2 = await encrypt_s(M2, keypair.pubKey);

//         const decrypted_message1 = await decrypt(
//             keypair.privKey,
//             encryption1.ephemeral_key,
//             encryption1.encrypted_message,
//         );
//         const decrypted_message2 = await decrypt(
//             keypair.privKey,
//             encryption2.ephemeral_key,
//             encryption2.encrypted_message,
//         );

//         const dlo = await decode(decrypted_message1, 19);
//         const dhi = await decode(decrypted_message2, 19);

//         const decoded_input = dlo + b32 * dhi;

//         assert(decoded_input === input, "decoding led to different result!");
//     });

//     it("Check unhappy decoding breaks Elgamal linear homomorphism", async () => {
//         // The input should be a 64-bit number
//         const input = getInRange(1n, b32 ** 2n);

//         // the initial input is split into two 32-bit numbers for faster decoding
//         const [xlo, xhi] = split64(input);

//         // we swap xlo and xhi to mess with the decoding
//         const M1 = await encode(xhi);
//         const M2 = await encode(xlo);

//         const keypair = await genKeypair();

//         const encryption1 = await encrypt_s(M1, keypair.pubKey);
//         const encryption2 = await encrypt_s(M2, keypair.pubKey);

//         const decrypted_message1 = await decrypt(
//             keypair.privKey,
//             encryption1.ephemeral_key,
//             encryption1.encrypted_message,
//         );
//         const decrypted_message2 = await decrypt(
//             keypair.privKey,
//             encryption2.ephemeral_key,
//             encryption2.encrypted_message,
//         );

//         const dlo = await decode(decrypted_message1, 19);
//         const dhi = await decode(decrypted_message2, 19);

//         const decoded_input = dlo + b32 * dhi;

//         assert(decoded_input !== input, "decoding led to different result!");
//     });

//     it("Check LOOPED decoding preserves Elgamal linear homomorphism", async () => {
//         for (let i = 0; i < 10; i++) {
//             // The input should be a 64-bit number
//             let input = getInRange(1n, b32 ** 2n);

//             // the initial input is split into two 32-bit numbers for faster decoding
//             let [xlo, xhi] = split64(input);

//             let M1 = await encode(xlo);
//             let M2 = await encode(xhi);

//             let keypair = await genKeypair();

//             const encryption1 = await encrypt_s(M1, keypair.pubKey);
//             const encryption2 = await encrypt_s(M2, keypair.pubKey);

//             const decrypted_message1 = await decrypt(
//                 keypair.privKey,
//                 encryption1.ephemeral_key,
//                 encryption1.encrypted_message,
//             );
//             const decrypted_message2 = await decrypt(
//                 keypair.privKey,
//                 encryption2.ephemeral_key,
//                 encryption2.encrypted_message,
//             );

//             const dlo = await decode(decrypted_message1, 19);
//             const dhi = await decode(decrypted_message2, 19);

//             const decoded_input = dlo + b32 * dhi;

//             assert(decoded_input === input, "decoding led to different result!");
//         }
//     });
// });
