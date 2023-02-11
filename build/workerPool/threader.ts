// const { bn254 } = require('../noble_bn254'); 
// const thread = require('worker_threads');
// const { workerData, isMainThread, parentPort  } = require('worker_threads');
// const fs = require('fs');

// function decode_threaded(cp, numThreads) {

//     function fetch_table() {
//     //return JSON.parse(fs.readFileSync(`../../lookupTables/x${pc}xlookupTable.json`));
//     return JSON.parse(fs.readFileSync(`../../lookupTables/xp17xlookup-table.json`));
//     }

//     let lookupTable;

//     if (!lookupTable) {
//     lookupTable = fetch_table();
//     }

//     const Point = bn254.ProjectivePoint;
//     const base = Point.BASE;


//     const range = BigInt(2**15);
//     //const cp = BigInt(2**15);

//     //const numThreads = 8; // Number of worker threads to use
//     let found = false;

//     if (isMainThread) {
        
//         // Main thread
//         console.time('threaded computation');
//         const b32 = bn254.CURVE.randomBytes(4);
//         const secret = BigInt('0x' + Buffer.from(b32).toString('hex'));
//         console.log('secret: ',secret.toString());
//         const eM_hex = base.multiplyUnsafe(secret).toHex();
        
//         // Create an array of worker threads
//         const workers = [];
//         for (let i = 0; i < numThreads; i++) {
//             workers.push(new thread.Worker(__filename, { workerData: { id: i, numThreads: numThreads, eM_hex } }));
//         }
    
//         // Listen for messages from the worker threads
//         for (const worker of workers) {

//             worker.on('message', (message) => {

//             if (lookupTable.hasOwnProperty(message.key)) {

//                 console.log('decoded : ',(BigInt(message.xlo) + range * BigInt('0x' + lookupTable[message.key])).toString())
//                 console.log('iteration num: ', message.xlo);
//                 found = true;
//                 console.timeEnd('threaded computation');
                
//                 // Send a message to all worker threads to stop processing
//                 for (const w of workers) {
//                     w.postMessage({ stop: true });
//                 }
//             }
//             });
//         }
//     } else {

//         // Worker thread
//         const start = workerData.id * (Number(range) / workerData.numThreads);
//         const end = start + (Number(range) / workerData.numThreads);
        
//         parentPort.on('message', (message) => {
//             if (message.stop) {
//             // Stop processing if received a message to stop
//             parentPort.close();
//             }
//         });
        
//         const eM = bn254.ProjectivePoint.fromHex(workerData.eM_hex);
        
//         for (let xlo = start; xlo < end; xlo++) {
            
//             // Calculate the key for lookup
//             const key = eM.subtract(base.multiplyUnsafe(BigInt(xlo))).toAffine().x.toString(16); 

//             // Send the result back to the main thread
//             parentPort.postMessage({ key, xlo: xlo });
            
//             // Check if a message has been received to stop processing
//             if (parentPort.closed) {
//                 break;
//             }
//         }
//     }
// }


