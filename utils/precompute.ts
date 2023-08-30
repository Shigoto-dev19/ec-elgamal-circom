const buildBabyjub = require("circomlibjs").buildBabyjub;
const fs = require('fs');

const ProgressBar = require('cli-progress');

const bar = new ProgressBar.SingleBar({
  format: 'Progress |' + '{bar}' + '| {percentage}% || {value}/{total} Chunks || Remaining time: {eta_formatted}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});


/**
 * Build lookup table to break discrete log for 32-bit scalars for decoding
 * @param pc_size the size of the lookup table to be used --> 2**pc_size
 * @returns an object that contains 2**pc_size of keys and values
 */

async function precompute(pc_size) {
    const directoryName = "lookupTables";
    // Check if the lookupTables directory exists
    if (!fs.existsSync(directoryName)) {
      // If it doesn't exist, create it
      fs.mkdirSync(directoryName);
      console.log(`Directory "${directoryName}" created.`);
    }
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;
    const range = 32 - pc_size; 
    const end = BigInt(2)**BigInt(pc_size);
    
    let lookup = {};
    let key : string;

    bar.start(Number(end), 0);

    for (let xhi = BigInt(0); xhi < end; xhi++) {
        key = babyjub.mulPointEscalar(babyjub.Base8, xhi *BigInt(2)**BigInt(range))[0];
        // key = base.multiplyUnsafe(xhi *BigInt(2)**BigInt(range)).toAffine().x.toString(16);
        lookup[Fr.toString(key)] = xhi.toString(16);
        bar.update(Number(xhi) + 1);
    }
    bar.stop();

    fs.writeFileSync(`./lookupTables/x${pc_size}xlookupTable.json`, JSON.stringify(lookup));    
}

precompute(process.argv[2] || 19);
