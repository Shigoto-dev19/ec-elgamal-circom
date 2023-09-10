import { babyJub } from "../src/index";
const buildBabyjub = require("circomlibjs").buildBabyjub;
const fs = require("fs");

function fetch_table(pc) {
    return JSON.parse(fs.readFileSync(`./lookupTables/x${pc}xlookupTable.json`));
}

let lookupTable;

/**
 * Computes Discrete Log for Decoding
 * @param C encoded message --> C = [x]G
 * @param pc the size of the lookup table to be used --> 2^pc // pc = 19 for default single thread
 * @returns decoded message x from [x]G
 */

async function decode_circomlibjs(C, pc: number): Promise<bigint> {
    /* The first time decode is called, it will call fetch_table() and store the lookupTable variable. 
       Subsequent calls to fetchTable() will use the table stored in the lookupTable variable, rather than calling functionA again.
       This will save the time from reading the lookupTable whenever decode is called again
     */
    //if (!lookupTable) {
        lookupTable = fetch_table(pc);
    //}
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;

    const n = 32 - pc;
    const end = BigInt(2) ** BigInt(n);

    for (let xlo = BigInt(0); xlo < end; xlo++) {
        let loBase = babyjub.mulPointEscalar(babyjub.Base8, xlo);
        loBase[0] = Fr.neg(loBase[0]);
        let key = babyjub.addPoint(loBase, C);
        key = Fr.toString(key[0]);
        // let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);

        if (lookupTable.hasOwnProperty(key)) {
            return xlo + end * BigInt("0x" + lookupTable[key]);
        }
    }
}

function decode(C, pc: number): bigint {
    /* The first time decode is called, it will call fetch_table() and store the lookupTable variable. 
       Subsequent calls to fetchTable() will use the table stored in the lookupTable variable, rather than calling functionA again.
       This will save the time from reading the lookupTable whenever decode is called again
     */
    //if (!lookupTable) {
        lookupTable = fetch_table(pc);
    //}

    const n = 32 - pc;
    const end = BigInt(2) ** BigInt(n);

    for (let xlo = BigInt(0); xlo < end; xlo++) {
        // let loBase = babyjub.mulPointEscalar(babyjub.Base8, xlo);
        // loBase[0] = Fr.neg(loBase[0]);
        // let key = babyjub.addPoint(loBase, C);
        // key = Fr.toString(key[0]);
        let loBase = babyJub.BASE.multiplyUnsafe(xlo)
        let key = C.subtract(loBase).toAffine().x.toString();

        if (lookupTable.hasOwnProperty(key)) {
            return xlo + end * BigInt("0x" + lookupTable[key]);
        }
    }
}

function encode(plaintext: bigint) {
    if (plaintext <= BigInt(2) ** BigInt(32)) {
        return babyJub.BASE.multiplyUnsafe(plaintext); //base.multiply(x)
    } else throw new Error("The input should be 32-bit bigint");
}
// xlo and xhi merging  verification

function split64(x: bigint): [bigint, bigint] {
    function padBin(x: string) {
        return "0".repeat(64 - x.length) + x;
    }
    const limit = BigInt(2) ** BigInt(64n);

    if (x <= limit) {
        const bin64 = padBin(x.toString(2));

        const xhi = "0b" + bin64.substring(0, 32); // the first 32 bits
        const xlo = "0b" + bin64.substring(32, 64); // the last 32 bits

        return [BigInt(xlo), BigInt(xhi)];
    } else throw new Error("The input should be 64-bit bigint");
}

export { 
    decode_circomlibjs,
    decode, 
    encode, 
    split64,
 };
