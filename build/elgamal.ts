import { bn254 } from './noble_bn254'; 
import { ProjPointType } from './abstract/weierstrass';


// Textbook Elgamal Encryption Scheme over alt_bn128 curve without message encoding 
const Point = bn254.ProjectivePoint;
const G = Point.BASE;
const fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; 

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
  };

export function getRandomPoint() : ProjPointType<bigint> {
    return G.multiplyUnsafe(getInRange(BigInt(1), fp))
}

// generate private and public key for the receiver
export function key_pair() : [bigint, ProjPointType<bigint>] {

  let private_key = getInRange(BigInt(1), fp);
  let public_key = G.multiply(private_key);
  return [private_key, public_key];
}

// The Sender
export function encrypt(public_key: ProjPointType<bigint>) : [ProjPointType<bigint>, ProjPointType<bigint>, ProjPointType<bigint>, bigint ] {

  const M = G.multiply(getInRange(BigInt(1), fp));                          // The sender chooses the message as a point on the curve
  
  let k = getInRange(BigInt(1), fp);                                         // The sender chooses a secret key as a nonce 
  
  let Ke = G.multiply(k);                                                   // The sender calculates an ephemeral key (nonce)
  let Km = Point.ZERO;
  if (public_key.assertValidity && !public_key.equals(Point.ZERO) ){
    Km = public_key.multiply(k).add(M);                                     // The sender encrypts the message
  } 
  else throw new Error ('Invalid Public Key!');
  
  return [M, Ke, Km, k];
}

// ---> Sender sends the ephemeral key Ke and the encrypted message Km to the receiver
  
export function decrypt(private_key : bigint, ephemeral_key: ProjPointType<bigint>, encrypted_message: ProjPointType<bigint>) {

  const Km = encrypted_message;
  const Ke = ephemeral_key;
  const d = private_key;
  const Md = Km.add(Ke.multiply(d).negate());                               // The receiver decrypts the message 
  
  return Md;
}

// ElGamal Scheme with specified inputs for testing purposes
export function encrypt_s(M : ProjPointType<bigint>, public_key: ProjPointType<bigint>, k = getInRange(BigInt(1), fp)) {

  let Ke = G.multiply(k);                                                   // The sender calculates an ephemeral key
  let eM = Point.ZERO;

  eM = public_key.multiply(k).add(M);                                       // The sender encrypts the message
  
  return [Ke, eM];
}


/* //Test case for compliant encryption/decryption
const [private_key, public_key] = key_pair();
const [M, ephemeral_key, encrypted_message] = encrypt(public_key);
const Md = decrypt(private_key,  ephemeral_key, encrypted_message);

console.log("\nthe message M : \n x: ",M.toAffine().x.toString(),"\n y: ", M.toAffine().y.toString());
console.log("\nthe decrypted message Md : \n x: ",Md.toAffine().x.toString(),"\n y: ", Md.toAffine().y.toString());
console.log("\nthe ephemeral key Ke : \n x: ",ephemeral_key.toAffine().x.toString(),"\n y: ", ephemeral_key.toAffine().y.toString());
console.log("\npublic key pk : \n x: ", public_key.toAffine().x.toString(),"\n y: ", public_key.toAffine().y.toString());
console.log("\nencrypted message eM : \n x: ", encrypted_message.toAffine().x.toString(),"\n y: ", encrypted_message.toAffine().y.toString());
console.log("\n\nprivate_key pk : \n ", private_key.toString());
*/
