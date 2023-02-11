const { bn254 } = require('./noble_bn254'); 
//import { bn254 } from './noble_bn254'; 
const thread = require('worker_threads');
const { workerData, isMainThread, parentPort } = require('worker_threads');
const fs = require('fs');

const Point = bn254.ProjectivePoint;

/**
 * Computes Discrete Log for Decoding using worker_threads for faster computation
 * @param C encoded message --> C = [x]G 
 * @param pc the size of the lookup table to be used --> 2^pc
 * @param numThreads the number of worker threads to use
 * @returns decoded message x from [x]G
 */
async function decode_threaded(C , pc , numThreads) {

    function fetch_table() {
        return JSON.parse(fs.readFileSync(`../lookupTables/x${pc}xlookupTable.json`));
    }

    let lookupTable;
    
    if (!lookupTable) {
    lookupTable = fetch_table();
    }

    const Point = bn254.ProjectivePoint;
    const base = Point.BASE;

    const num = 32 - pc;
    const range = BigInt(2**num);

    let found = false;
    let decoded;

    return new Promise((resolve, reject) => {
        if (isMainThread) {
            
            // Main thread
            
            const eM_hex = C.toHex();
            
            // Create an array of worker threads
            const workers = [];
            for (let i = 0; i < numThreads; i++) {
                workers.push(new thread.Worker(__filename, { workerData: { id: i, numThreads: numThreads, eM_hex } }));
            }
        
            // Listen for messages from the worker threads
            for (const worker of workers) {

                worker.on('message', (message) => {

                if (lookupTable.hasOwnProperty(message.key)) {

                    decoded = BigInt(message.xlo) + range * BigInt('0x' + lookupTable[message.key]);
                    
                    found = true;
                    
                    // Send a message to all worker threads to stop processing
                    for (const w of workers) {
                        w.postMessage({ stop: true });
                    }
                    
                    // Resolve the Promise with the result as decoded number
                    resolve( decoded );    
                } 
                });
            }
        } else {

            // Worker thread
            const start = workerData.id * (Number(range) / workerData.numThreads);
            const end = start + (Number(range) / workerData.numThreads);
            
            parentPort.on('message', (message) => {
                if (message.stop) {
                // Stop processing if received a message to stop
                parentPort.close();
                }
            });
            
            const eM = bn254.ProjectivePoint.fromHex(workerData.eM_hex);
            
            for (let xlo = start; xlo < end; xlo++) {
                
                // Calculate the key for lookup
                const key = eM.subtract(base.multiplyUnsafe(BigInt(xlo))).toAffine().x.toString(16); 

                // Send the result back to the main thread
                parentPort.postMessage({ key, xlo: xlo });
                
                // Check if a message has been received to stop processing
                if (parentPort.closed) {
                    break;
                }
            }
        }
    });
}

/**
 * Computes Discrete Log for Decoding using worker_threads for faster computation
 * @param C encoded message --> C = [x]G 
 * @param pc the size of the lookup table to be used --> 2^pc
 * @param numThreads the number of worker threads to use
 * @param lookupTable the lookupTable of size pc entered manually as a variable
 * @returns decoded message x from [x]G
 */

export async function decode_threaded_VLT(C , pc , numThreads, lookupTable) {

    let lookupTable_main = lookupTable;
    
    const Point = bn254.ProjectivePoint;
    const base = Point.BASE;

    const num = 32 - pc;
    const range = BigInt(2**num);

    let found = false;
    let decoded;

    return new Promise((resolve, reject) => {
        
        if (isMainThread) {
            
            // Main thread
            
            const eM_hex = C.toHex();
            
            // Create an array of worker threads
            const workers = [];
            for (let i = 0; i < numThreads; i++) {
                workers.push(new thread.Worker(__filename, { workerData: { id: i, numThreads: numThreads, eM_hex } }));
            }
        
            // Listen for messages from the worker threads
            for (const worker of workers) {

                worker.on('message', (message) => {

                if (lookupTable_main.hasOwnProperty(message.key)) {

                    decoded = BigInt(message.xlo) + range * BigInt('0x' + lookupTable_main[message.key]);
                    
                    found = true;
                    
                    // Send a message to all worker threads to stop processing
                    for (const w of workers) {
                        w.postMessage({ stop: true });
                    }
                    
                    // Resolve the Promise with the result as decoded number
                    resolve( decoded );    
                } 
                });
            }
        } else {

            // Worker thread
            const start = workerData.id * (Number(range) / workerData.numThreads);
            const end = start + (Number(range) / workerData.numThreads);
            
            parentPort.on('message', (message) => {
                if (message.stop) {
                // Stop processing if received a message to stop
                parentPort.close();
                }
            });
            
            const eM = bn254.ProjectivePoint.fromHex(workerData.eM_hex);
            
            for (let xlo = start; xlo < end; xlo++) {
                
                // Calculate the key for lookup
                const key = eM.subtract(base.multiplyUnsafe(BigInt(xlo))).toAffine().x.toString(16); 

                // Send the result back to the main thread
                parentPort.postMessage({ key, xlo: xlo });
                
                // Check if a message has been received to stop processing
                if (parentPort.closed) {
                    break;
                }
            }
        }
    });
}

module.exports = {decode_threaded, decode_threaded_VLT};

// const b32 = bn254.CURVE.randomBytes(4);
// const secret = BigInt('0x' + Buffer.from(b32).toString('hex'));
// console.log('secret: ',secret.toString());
// const G = Point.BASE;
// const C = G.multiplyUnsafe(secret);

// decode_threaded(C,16,4) 
//     .then((decoded) => {
//         console.log('decoded: ',decoded);
//   })
//     .catch((err) => {
//         console.error(err);
//   });
