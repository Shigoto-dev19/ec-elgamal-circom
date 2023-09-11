import { ExtPointType } from "@noble/curves/abstract/edwards";
import { babyJub } from "../src/index";
const fs = require("fs");

function fetch_table(precomputeSize: number) {
    return JSON.parse(fs.readFileSync(`./lookupTables/x${precomputeSize}xlookupTable.json`));
}

let lookupTable;

function decode(encoded: ExtPointType, precomputeSize: number): bigint {
    /* The first time decode is called, it will call fetch_table() and store the lookupTable variable. 
       Subsequent calls to fetchTable() will use the table stored in the lookupTable variable, rather than calling functionA again.
       This will save the time from reading the lookupTable whenever decode is called again
     */
    if (!lookupTable || Object.keys(lookupTable).length != 2**precomputeSize) {
       lookupTable = fetch_table(precomputeSize);
    }

    const range = 32 - precomputeSize;
    const rangeBound = BigInt(2) ** BigInt(range);

    for (let xlo = BigInt(0); xlo < rangeBound; xlo++) {
        let loBase = babyJub.BASE.multiplyUnsafe(xlo)
        let key = encoded.subtract(loBase).toAffine().x.toString();

        if (lookupTable.hasOwnProperty(key)) {
            return xlo + rangeBound * BigInt("0x" + lookupTable[key]);
        }
    }
    throw new Error("Not Found!");
}

function encode(plaintext: bigint): ExtPointType {
    if (plaintext <= BigInt(2) ** BigInt(32)) {
        return babyJub.BASE.multiplyUnsafe(plaintext);
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
        // the first 32 bits
        const xhi = "0b" + bin64.substring(0, 32); 
        // the last 32 bits
        const xlo = "0b" + bin64.substring(32, 64); 

        return [BigInt(xlo), BigInt(xhi)];
    } else throw new Error("The input should be 64-bit bigint");
}

export { 
    decode, 
    encode, 
    split64,
 };
