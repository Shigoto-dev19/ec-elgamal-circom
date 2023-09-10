import * as bench from 'micro-bmark';
import * as assert from 'assert'
import { decode_circomlibjs, decode, encode } from '../utils/decode';
import { genRandomPoint, genRandomSalt, babyJub } from '../src';
import { toStringArray, pruneTo32Bits } from '../utils/tools';
const { mark, compare, run } = bench;
const buildBabyjub = require("circomlibjs").buildBabyjub;

async function decode_old(F: any, pc: number) {
    const salt = pruneTo32Bits(genRandomSalt());
    // const encoded = toStringArray(babyJub.BASE.multiply(salt)).map(x => F.e(x));
    const encoded = await encode(salt);
    const decoded = await decode_circomlibjs(encoded, pc);
    assert(salt === decoded);

    return decoded
}

async function decode_noble(pc: number) {
    const salt = pruneTo32Bits(genRandomSalt());
    const encoded = babyJub.BASE.multiplyUnsafe(salt);
    const decoded = decode(encoded, pc);
    assert(salt === decoded);

    return decoded
}

run(async () => {
    await compare('decode-noble', 5, {
        precomputed19: () => decode_noble(19),
        precomputed18: () => decode_noble(18),
        precomputed17: () => decode_noble(17),
        precomputed16: () => decode_noble(16),
    });
    const babyjub = await buildBabyjub();
    const F = babyjub.F;
    await compare('decode-circomlibjs', 5, {
        precomputed19: () => Promise.resolve(decode_old(F, 19)),
        precomputed18: () => Promise.resolve(decode_old(F, 18)),
        precomputed17: () => Promise.resolve(decode_old(F, 17)),
        precomputed16: () => Promise.resolve(decode_old(F, 16)),
    });
    bench.utils.logMem(); // Log current RAM
});