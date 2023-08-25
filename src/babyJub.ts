const crypto = require("crypto");
const buildBabyjub = require("circomlibjs").buildBabyjub;

export function getInRange(min: bigint, max: bigint): bigint {
    function uint8ArrayToBigInt(uint8Array: Uint8Array): bigint {
        let stringValue = "";
        for (let i = 0; i < uint8Array.length; i++) {
            stringValue += uint8Array[i].toString(16);
        }
        return BigInt("0x" + stringValue);
    }

    // calculate the range of the interval subtracting _1n to exclude the maximum
    const range = max - min - BigInt(1);
    // calculate the number of random bytes in the range
    const bytes_num = Math.floor((range.toString(2).length - 1) / 8);
    let bi = undefined;

    do {
        // generate random bytes according to the number of bytes in range
        const buffer = crypto.randomBytes(bytes_num);
        // convert the random bytes to bigint and add the min
        bi = uint8ArrayToBigInt(buffer) + min;
        // repeat till the number obtained is less than max (the desired range)
    } while (bi >= max);

    return bi;
}

export async function getRandomPoint() {
    const babyjub = await buildBabyjub();
    const coeff = getInRange(1n, babyjub.order);
    return babyjub.mulPointEscalar(babyjub.Base8, coeff);
}

// generate private and public key for the receiver
export async function genKeypair() {
    const babyjub = await buildBabyjub();
    const private_key = getInRange(1n, babyjub.order);
    const public_key = babyjub.mulPointEscalar(babyjub.Base8, private_key);
    return { private_key, public_key };
}
// TODO: test cases for invalid public key
// The Sender
export async function encrypt(public_key) {
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;
    // encoded message as point on curve
    // The sender chooses the message M as a point on the curve
    const message = await getRandomPoint();

    // The sender chooses a secret key as a nonce k
    const nonce = getInRange(BigInt(1), babyjub.order);

    // The sender calculates an ephemeral key (nonce) Ke
    const ephemeral_key = babyjub.mulPointEscalar(babyjub.Base8, nonce);
    let encrypted_message = [Fr.e("0"), Fr.e("1")];
    // The sender encrypts the message Km
    if (babyjub.inCurve(public_key) && public_key[0] !== Fr.e("0") && public_key[1] !== Fr.e("1")) {
        encrypted_message = babyjub.mulPointEscalar(public_key, nonce);
        encrypted_message = babyjub.addPoint(encrypted_message, message);
    } else throw new Error("Invalid Public Key!");

    return { message, ephemeral_key, encrypted_message, nonce, Fr };
}

// ---> Sender sends the ephemeral key Ke and the encrypted message Km to the receiver
export async function decrypt(private_key, ephemeral_key, encrypted_message) {
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;

    let dKe = babyjub.mulPointEscalar(ephemeral_key, private_key);
    dKe[0] = Fr.neg(dKe[0]);
    // The receiver decrypts the message Km - [d].Ke
    const decrypted_message = babyjub.addPoint(encrypted_message, dKe);

    return decrypted_message;
}

// ElGamal Scheme with specified inputs for testing purposes
export async function encrypt_s(message, public_key, nonce?) {
    const babyjub = await buildBabyjub();
    nonce = nonce ?? getInRange(1n, babyjub.order);
    const Fr = babyjub.F;
    const ephemeral_key = babyjub.mulPointEscalar(babyjub.Base8, nonce);
    let encrypted_message = babyjub.mulPointEscalar(public_key, nonce);
    encrypted_message = babyjub.addPoint(encrypted_message, message);

    return { ephemeral_key, encrypted_message };
}

// genKeypair().then((keypair) => {
//     // receiver's public key
//     const private_key = keypair.private_key;
//     console.log('receiver private key: ', private_key);
//     const public_key = keypair.public_key;

//     encrypt(public_key).then(output => {
//         getRandomPoint().then((result) => {
//             console.log('random jubjub point: ', result.map(x => output.Fr.toString(x)))
//         })
//         console.log('receiver public key: ', public_key.map(x => output.Fr.toString(x)));
//         console.log('sender ephemeral key: ', output.ephemeral_key.map(x => output.Fr.toString(x)));
//         console.log('sender message: ', output.message.map(x => output.Fr.toString(x)));
//         console.log('sender nonce: ', output.nonce);
//         console.log('sender encrypted message: ', output.encrypted_message.map(x => output.Fr.toString(x)));
//         decrypt(private_key, output.ephemeral_key, output.encrypted_message).then(decrypted_message => {
//             const message = output.message.map(x => output.Fr.toString(x));
//             console.log('plain message before encryption: ', message);
//             const decrypted = decrypted_message.map(x => output.Fr.toString(x));
//             console.log('message after decryption: ', decrypted);
//             console.log("compliant message: ", message[0] == decrypted[0] && message[1] == decrypted[1])
//         })
//     })
// })
