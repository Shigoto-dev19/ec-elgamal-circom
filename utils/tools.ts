const createBlakeHash = require("blake-hash");
const ff = require("ffjavascript");

const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts;
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts;

import { Scalar } from "ffjavascript";
import { babyJub as CURVE } from "./babyjub-noble";
import { BabyJubAffinePoint, BabyJubExtPoint } from "../src";
const babyJub = CURVE.ExtendedPoint;

// Taken from https://github.com/iden3/circomlibjs/blob/main/src/eddsa.js
function pruneBuffer(buff) {
    buff[0] = buff[0] & 0xf8;
    buff[31] = buff[31] & 0x7f;
    buff[31] = buff[31] | 0x40;
    return buff;
}

// Taken from https://github.com/iden3/circomlibjs/blob/main/src/eddsa.js
function prv2pub(prv) {
    const sBuff = pruneBuffer(createBlakeHash("blake512").update(Buffer.from(prv)).digest());
    let s = Scalar.fromRprLE(sBuff, 0, 32);
    const A = babyJub.BASE.multiply(BigInt(Scalar.shr(s, 3)));
    return A;
}

/**
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PubKey and other circuits.
 */
function formatPrivKeyForBabyJub(privKey: bigint) {
    const sBuff = pruneBuffer(
        createBlakeHash("blake512").update(bigInt2Buffer(privKey)).digest().slice(0, 32),
    );
    const s = ff.utils.leBuff2int(sBuff);
    return ff.Scalar.shr(s, 3);
}

/**
 * Convert a BigInt to a Buffer
 */
const bigInt2Buffer = (i: BigInt): Buffer => {
    return Buffer.from(i.toString(16), "hex");
};

/**
 * Convert an EC extended point into an array of two bigints
 */
function toBigIntArray(point: BabyJubExtPoint): Array<bigint> {
    const point_affine = point.toAffine();
    const x = point_affine.x;
    const y = point_affine.y;
    return [x, y];
}

/**
 * Convert an EC extended point into an array of two strings
 */
function toStringArray(point: BabyJubExtPoint): Array<string> {
    const point_affine = point.toAffine();
    const x = point_affine.x.toString();
    const y = point_affine.y.toString();
    return [x, y];
}

/**
 * Convert two strings x and y into an EC extended point
 */
function coordinatesToExtPoint(x: string, y: string): BabyJubExtPoint {
    const x_bigint = BigInt(x);
    const y_bigint = BigInt(y);
    const affine_point: BabyJubAffinePoint = { x: x_bigint, y: y_bigint };

    return babyJub.fromAffine(affine_point);
}

function pruneTo64Bits(originalValue: bigint): bigint {
    return originalValue & BigInt("0xFFFFFFFFFFFFFFFF");
}

// Prune the 253-bit BigInt to 32 bits
function pruneTo32Bits(bigInt253Bit: bigint): bigint {
    // Create a mask for 32 bits (all bits set to 1)
    const mask32Bit = (1n << 32n) - 1n;

    // Prune to 32 bits using the mask
    const pruned32BitBigInt = bigInt253Bit & mask32Bit;

    return pruned32BitBigInt;
}

/**
 * - Returns a signal value similar to the "callGetSignalByName" function from the "circom-helper" package.
 * - This function depends on the "circom_tester" package.
 *
 * Example usage:
 *
 * ```typescript
 * const wasm_tester = require('circom_tester').wasm;
 *
 * /// the circuit is loaded only once and it is available for use across multiple test cases.
 * const circuit = await wasm_tester(path.resolve("./circuit/path"));
 * const witness = await circuit.calculateWitness(inputsObject);
 * await circuit.checkConstraints(witness);
 * await circuit.loadSymbols();
 *
 * /// You can check signal names by printing "circuit.symbols".
 * /// You will mostly need circuit inputs and outputs.
 * const singalName = 'ciphertext'; // ciphertext[0]
 * const signalValue = getSignalByName(circuit, witness, SignalName);
 * ```
 */
const getSignalByName = (circuit: any, witness: any, signalName: string) => {
    const signal = `main.${signalName}`;
    return witness[circuit.symbols[signal].varIdx].toString();
};

export {
    pruneBuffer,
    prv2pub,
    bigInt2Buffer,
    getSignalByName,
    stringifyBigInts,
    unstringifyBigInts,
    toStringArray,
    toBigIntArray,
    formatPrivKeyForBabyJub,
    coordinatesToExtPoint,
    pruneTo64Bits,
    pruneTo32Bits,
};
