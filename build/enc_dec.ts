import * as bn128 from "./alt_bn128";

// Classic Elgamal Encryption Scheme over alt_bn128 curve without message mapping

// generate private and public key for the receiver
export function key_pair() {

    const G = new bn128.Point(bn128.curve.Gx, bn128.curve.Gy);
    let private_key = bn128.getInRange(bn128.BI._1n, bn128.curve.n);
    let public_key = G.multiplyDA(private_key);
    return [private_key, public_key];
}

// The Sender
export function encrypt(public_key: bn128.Point) {

  const G = new bn128.Point(bn128.curve.Gx, bn128.curve.Gy);
  const M = G.multiplyDA(bn128.getInRange(bn128.BI._1n,bn128.curve.n));     // The sender chooses the message as a point on the curve
  
  let k = bn128.getInRange(bn128.BI._1n, bn128.curve.n);                    // The sender chooses a secret key as a nonce 
  //console.log("nonce key k: ",k);
  let Ke = G.multiplyDA(k);                                                 // The sender calculates an ephemeral key (nonce)
  let Km = bn128.Point.ZERO;
  if (public_key.check() && public_key.x.neq(0) && public_key.y.neq(0) ){
    Km = public_key.multiplyDA(k).add(M);                                   // The sender encrypts the message
  } 
  else throw new Error ('Invalid Public Key!');
  return [M, Ke, Km, k];
}

// ---> Sender sends the ephemeral key Ke and the encrypted message Km to the receiver
  
export function decrypt(private_key, ephemeral_key: bn128.Point, encrypted_message: bn128.Point) {

  const Km = encrypted_message;
  const Ke = ephemeral_key;
  const d = private_key;
  const Md = Km.add(Ke.multiplyDA(d).negate());                             // The receiver decrypts the message 
  
  return Md;
}

// ElGamal Scheme with specified inputs for testing purposes
export function encrypt_s(M : bn128.Point, public_key: bn128.Point, k ) {

  const G = new bn128.Point(bn128.curve.Gx, bn128.curve.Gy);
  
  let Ke = G.multiplyDA(k);                                                 // The sender calculates an ephemeral key
  let eM = bn128.Point.ZERO;

  eM = public_key.multiplyDA(k).add(M);                                     // The sender encrypts the message
  
  return [Ke, eM];
}



// const [private_key, public_key] = key_pair();
// const [M, ephemeral_key, encrypted_message] = encrypt(public_key);
// const Md = decrypt(private_key,  ephemeral_key, encrypted_message);

// console.log("\nthe message M : \n x: ",M.x.toString(),"\n y: ", M.y.toString());
// console.log("\nthe ephemeral key Ke : \n x: ",ephemeral_key.x.toString(),"\n y: ", ephemeral_key.y.toString());
// console.log("\npublic key pk : \n x: ", public_key.x.toString(),"\n y: ", public_key.y.toString());
// console.log("\nencrypted message eM : \n x: ", encrypted_message.x.toString(),"\n y: ", encrypted_message.y.toString());
// console.log("\n\nprivate_key pk : \n ", private_key.toString());
