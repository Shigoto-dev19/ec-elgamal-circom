const createBlakeHash = require('blake-hash');
const ff = require("ffjavascript");

const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

import { Scalar } from "ffjavascript";
import { babyJub as CURVE} from "./babyjub-noble";
import { ExtPointType } from "@noble/curves/abstract/edwards";

const babyJub = CURVE.ExtendedPoint;

function pruneBuffer(buff) {
    buff[0] = buff[0] & 0xF8;
    buff[31] = buff[31] & 0x7F;
    buff[31] = buff[31] | 0x40;
    return buff;
}

function prv2pub(prv) {
    const sBuff = pruneBuffer(createBlakeHash("blake512").update(Buffer.from(prv)).digest());
    let s = Scalar.fromRprLE(sBuff, 0, 32);
    const A = babyJub.BASE.multiply(Scalar.shr(s,3));
    return A;
}

/*
 * An internal function which formats a random private key to be compatible
 * with the BabyJub curve. This is the format which should be passed into the
 * PubKey and other circuits.
 */
const formatPrivKeyForBabyJub = (privKey: bigint) => {
    const sBuff = pruneBuffer(
        createBlakeHash("blake512").update(
            bigInt2Buffer(privKey),
        ).digest().slice(0,32)
    )
    const s = ff.utils.leBuff2int(sBuff)
    return ff.Scalar.shr(s, 3)
}

/*
 * Convert a BigInt to a Buffer
 */
const bigInt2Buffer = (i: BigInt): Buffer => {
    return Buffer.from(i.toString(16), 'hex')
}

function toBigIntArray(point: ExtPointType): Array<bigint> {
    const point_affine = point.toAffine();
    const x = point_affine.x;
    const y = point_affine.y;
    return [x, y]
}

function toStringArray(point: ExtPointType): Array<string> {
    const point_affine = point.toAffine();
    const x = point_affine.x.toString();
    const y = point_affine.y.toString();
    return [x, y]
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
 * const singalName = 'main.out'
 * const signalValue = getSignalByName(circuit, witness, SignalName)
 * ```
 */
const getSignalByName = (circuit: any, witness: any, signalName: string) => {
    return witness[circuit.symbols[signalName].varIdx].toString()
}

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
}