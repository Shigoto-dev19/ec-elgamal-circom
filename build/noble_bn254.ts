import { Fp } from './abstract/modular';
import { weierstrass } from './abstract/weierstrass';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { concatBytes, randomBytes } from '@noble/hashes/utils';

 
export const bn254 = weierstrass({
    a: 0n,
    b: 3n,
    Fp: Fp(21888242871839275222246405745257275088548364400416034343698204186575808495617n),
    n: 21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    Gx: 1n,
    Gy: 2n,
    hash: sha256,
    hmac: (key: Uint8Array, ...msgs: Uint8Array[]) => hmac(sha256, key, concatBytes(...msgs)),
    randomBytes,
    h: 1n
});

