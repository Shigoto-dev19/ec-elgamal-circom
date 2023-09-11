import * as bench from 'micro-bmark';
import * as assert from 'assert'
import { decode, encode } from '../utils/decode';
import { genRandomSalt, babyJub } from '../src';
import { pruneTo32Bits } from '../utils/tools';
const { compare, run } = bench;

async function decode_noble(precomputeSize: number) {
    const salt = pruneTo32Bits(genRandomSalt());
    const encoded = encode(salt);
    const decoded = decode(encoded, precomputeSize);
    assert(salt === decoded);

    return decoded
}

run(async () => {
    await compare('decode-noble', 25, {
        precomputed19: () => decode_noble(19),
        precomputed18: () => decode_noble(18),
        precomputed17: () => decode_noble(17),
        precomputed16: () => decode_noble(16),
    });
    bench.utils.logMem(); // Log current RAM
});