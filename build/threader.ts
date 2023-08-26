
// import { getInRange, getRandomPoint } from "../src/babyJub";
const { getInRange } = require("../src/babyJub");
const thread = require('worker_threads');
const { workerData, isMainThread, parentPort } = require('worker_threads');
const fs = require('fs');
const buildBabyjub = require("circomlibjs").buildBabyjub;


/**
 * Computes Discrete Log for Decoding using worker_threads for faster computation
 * @param C encoded message --> C = [x]G 
 * @param pc the size of the lookup table to be used --> 2^pc
 * @param numThreads the number of worker threads to use
 * @returns decoded message x from [x]G
 */
async function decode_threaded(C , pc , numThreads) {
    // (globalThis as any).curve_bn128.terminate();
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;

    function fetch_table() {
        return JSON.parse(fs.readFileSync(`../lookupTables/x${pc}xlookupTable.json`));
    }

    let lookupTable;
    
    if (!lookupTable) {
    lookupTable = fetch_table();
    }

    const num = 32 - pc;
    const range = BigInt(2**num);

    let found = false;
    let decoded;
    
    return new Promise((resolve, reject) => {
        if (isMainThread) {
            
            // Main thread
            
            const packed_C = babyjub.packPoint(C);
            
            // Create an array of worker threads
            const workers = [];
            for (let i = 0; i < numThreads; i++) {
                workers.push(new thread.Worker(__filename, { workerData: { id: i.toString(), numThreads, packed_C } }));
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
            const start = Number(workerData.id) * (Number(range) / workerData.numThreads);
            const end = start + (Number(range) / workerData.numThreads);
            
            parentPort.on('message', (message) => {
                if (message.stop) {
                // Stop processing if received a message to stop
                parentPort.close();
                }
            });
            
            const encoded_message = babyjub.unpackPoint(workerData.packed_C);
            
            for (let xlo = start; xlo < end; xlo++) {
                
                // Calculate the key for lookup
                let loBase = babyjub.mulPointEscalar(babyjub.Base8, xlo);
                loBase[0] = Fr.neg(loBase[0]);
                let key = babyjub.addPoint(loBase, encoded_message);
                key = Fr.toString(key[0]);

                // Send the result back to the main thread
                parentPort.postMessage({ key, xlo });
                
                // Check if a message has been received to stop processing
                if (parentPort.closed) {
                    break;
                }
            }
        }
    });
}

async function find_secret(C, pc, start, end, lookupTable) : Promise<bigint> {
    (globalThis as any).curve_bn128.terminate();
    const n = 32 - pc; 
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;
    
    for (let xlo=start; xlo< end; xlo++) {
        let loBase = babyjub.mulPointEscalar(babyjub.Base8, xlo);
        loBase[0] = Fr.neg(loBase[0]);
        let key = babyjub.addPoint(loBase, C);
        key = Fr.toString(key[0]);
        
        if (lookupTable.hasOwnProperty(key)) {
            return  (xlo + (BigInt(2)**BigInt(n)) * BigInt('0x' + lookupTable[key]))        
        }       
    }   
    return null; // Value not found        
} 

/**
 * Computes Discrete Log for Decoding using worker_threads for faster computation
 * @param C encoded message --> C = [x]G 
 * @param pc the size of the lookup table to be used --> 2^pc
 * @param numThreads the number of worker threads to use
 * @param lookupTable the lookupTable of size pc entered manually as a variable
 * @returns decoded message x from [x]G
 */

async function decode_threaded_VLT(C , pc , numThreads, lookupTable) {
    
    const babyjub = await buildBabyjub();
    const Fr = babyjub.F;

    let lookupTable_main = lookupTable;

    const num = 32 - pc;
    const range = BigInt(2**num);

    let found = false;
    let decoded;

    return new Promise((resolve, reject) => {
        
        if (isMainThread) {
            
            // Main thread
            const packed_C = babyjub.packPoint(C);
            
            // Create an array of worker threads
            const workerPromises = [];
            for (let i = 0; i < numThreads; i++) {
                const start = i * (Number(range) / numThreads);
                const end = start + (Number(range) / numThreads);
                const worker = new thread.Worker(__filename, { workerData: { start, end, packed_C } });
                // Listen for messages from the worker
                worker.on('message', (message) => {
                    if (message !== null) {
                        console.log(`Value found in worker: ${message}`);
                        // Terminate all workers when value is found
                        workerPromises.forEach((promise) => promise.cancel());
                    }
                });
            
                // Promisify worker completion
                const workerPromise = new Promise((resolve, reject) => {
                    worker.on('message', resolve);
                    worker.on('error', reject);
                });
            
                workerPromises.push(workerPromise);
            }
            // When all worker threads have completed, or the value is found, clean up
            Promise.allSettled(workerPromises)
            .then(() => {
                console.log('All workers completed or value found. Terminating.');
                workerPromises.forEach((promise) => promise.cancel());
            })
            .catch((err) => {
                console.error('Error in worker:', err);
            });
        } else {
            // This is a worker thread

            // Access the data passed to the worker
            const { start, end } = workerData;
            const encoded_message = babyjub.unpackPoint(workerData.packed_C);
            (globalThis as any).curve_bn128.terminate();

            // Search for the value in the worker
            find_secret(encoded_message, pc, start, end, lookupTable_main)
                .then((result) => {
                // Send the result back to the main thread
                parentPort.postMessage(result);
                })
                .catch((error) => {
                // Handle errors
                parentPort.postMessage(null); // Value not found
                });

            // Worker thread  
            // parentPort.on('message', (message) => {
            //     if (message.stop) {
            //     // Stop processing if received a message to stop
            //     parentPort.close();
            //     }
            // });
            
            // const encoded_message = babyjub.unpackPoint(workerData.packed_C);
            
            // for (let xlo = start; xlo < end; xlo++) {
                
            //     // Calculate the key for lookup
            //     let loBase = babyjub.mulPointEscalar(babyjub.Base8, xlo);
            //     loBase[0] = Fr.neg(loBase[0]);
            //     let key = babyjub.addPoint(loBase, encoded_message);
            //     key = Fr.toString(key[0]);

            //     // Send the result back to the main thread
            //     parentPort.postMessage({ key, xlo });
                
            //     // Check if a message has been received to stop processing
            //     if (parentPort.closed) {
            //         break;
            //     }
            // }
        }
    });
}

module.exports = {decode_threaded, decode_threaded_VLT};

// async function run() {
//     const babyjub = await buildBabyjub();
//     const Fr = babyjub.F;
//     const lookupTable = JSON.parse(fs.readFileSync(`./lookupTables/x${16}xlookupTable.json`));
//     const secret = getInRange(1n, babyjub.order);
//     const encodedPoint = babyjub.mulPointEscalar(babyjub.Base8, secret);
//     console.log('secret: ', secret.toString());
//     const decoded = await decode_threaded_VLT(encodedPoint, 16, 4, lookupTable);
//     console.log('decoded: ', decoded);
//     // decode_threaded(encodedPoint,16,4) 
//     //     .then((decoded) => {
//     //         console.log('decoded: ', decoded);
//     //   })
//     //     .catch((err) => {
//     //         console.error(err);
//     //   });
// }

