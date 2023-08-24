import { bn254 } from '../build/noble_bn254'; 

const buildBabyjub = require("circomlibjs").buildBabyjub;

const Fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export function getInRange(min : bigint ,max : bigint) : bigint {

    function uint8ArrayToBigInt(uint8Array : Uint8Array) : bigint {
        let stringValue = "";
        for (let i = 0; i < uint8Array.length; i++) {
          stringValue += uint8Array[i].toString(16);
        }
        return BigInt("0x" + stringValue);
      }
    
    const range = max - min - BigInt(1);                                    // calculate the range of the interval subtracting _1n to exclude the maximum
    const bytes_num = Math.ceil((range.toString(2).length - 1) / 8)         // calculate the number of random bytes in the range
    let bi = undefined;
  
    do {
        const buffer = bn254.CURVE.randomBytes(bytes_num);                  // generate random bytes according to the number of bytes in range
        bi = uint8ArrayToBigInt(buffer) + min;                              // convert the random bytes to bigint and add the min
      } while (bi >= max);                                                  // repeat till the number obtained is less than max (the desired range)
    
    return bi 
}

export async function getRandomPoint() {
    const babyjub = await buildBabyjub();
    const coeff = getInRange(1n, Fp);
    return babyjub.mulPointEscalar(babyjub.Base8, coeff);//.map(x => Fr.toString(x));
}

// generate private and public key for the receiver
export async function genKeypair() {
    const babyjub = await buildBabyjub();
    const private_key = getInRange(BigInt(1), Fp);
    const public_key = babyjub.mulPointEscalar(babyjub.Base8, private_key);
    return {private_key, public_key};

}
// TODO: test cases for invalid public key 
// The Sender
export async function encrypt(public_key) {
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;
    // encoded message as point on curve 
    const message = await getRandomPoint();                                                              // The sender chooses the message M as a point on the curve
    
    const nonce = getInRange(BigInt(1), Fp);                                                             // The sender chooses a secret key as a nonce k
    
    const ephemeral_key = babyjub.mulPointEscalar(babyjub.Base8, nonce);                                 // The sender calculates an ephemeral key (nonce) Ke
    let encrypted_message = [Fr.e("0"),Fr.e("1")];
    
    if (babyjub.inCurve(public_key) && public_key[0] !== Fr.e("0") && public_key[1] !== Fr.e("1")){
        encrypted_message = babyjub.mulPointEscalar(public_key, nonce);
        encrypted_message = babyjub.addPoint(encrypted_message, message);                                // The sender encrypts the message Km
    } 
    else throw new Error ('Invalid Public Key!');
    
    return {message, ephemeral_key, encrypted_message, nonce, Fr}
}

// ---> Sender sends the ephemeral key Ke and the encrypted message Km to the receiver
export async function decrypt(private_key, ephemeral_key, encrypted_message) {
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;

    let dKe = babyjub.mulPointEscalar(ephemeral_key, private_key);
    dKe[0] = Fr.neg(dKe[0]);
    const decrypted_message = babyjub.addPoint(encrypted_message, dKe);
    // const decrypted_message = Km.add(Ke.multiply(d).negate());                               // The receiver decrypts the message Km - [d].Ke

    return decrypted_message;
}

// ElGamal Scheme with specified inputs for testing purposes
export async function encrypt_s(message , public_key, nonce = getInRange(1n, Fp)) {
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;
    const ephemeral_key = babyjub.mulPointEscalar(babyjub.Base8, nonce);                                                   // The sender calculates an ephemeral key
    let encrypted_message = [Fr.e("0"),Fr.e("1")];
    encrypted_message = babyjub.mulPointEscalar(public_key, nonce);
    encrypted_message = babyjub.addPoint(encrypted_message, message)                                       // The sender encrypts the message
    
    return {ephemeral_key, encrypted_message };
}

genKeypair().then((keypair) => {
    // receiver's public key 
    const private_key = keypair.private_key;
    const public_key = keypair.public_key;
    encrypt(public_key).then(output => {
        getRandomPoint().then((result) => {
            console.log('random jubjub point: ', result.map(x => output.Fr.toString(x)))
        })
        decrypt(private_key, output.ephemeral_key, output.encrypted_message).then(decrypted_message => {
            const message = output.message.map(x => output.Fr.toString(x));
            console.log('plain message before encryption: ', message);
            const decrypted = decrypted_message.map(x => output.Fr.toString(x));
            console.log('message after decryption: ', decrypted);
            console.log("compliant message: ", message[0] == decrypted[0] && message[1] == decrypted[1])
        })
    })
})
