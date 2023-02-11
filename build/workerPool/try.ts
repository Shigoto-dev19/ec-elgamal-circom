//import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { bn254 } from '../noble_bn254'; 
import { decode_threaded_VLT } from '../threader'; 
import { ProjPointType } from '../abstract/weierstrass';
const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require('fs');

function fetch_table(pc) {
  return JSON.parse(fs.readFileSync(`../../lookupTables/x${pc}xlookupTable.json`));
}

let lookupTable;

if (!lookupTable) {
  lookupTable = fetch_table(19);
}


const pc = 32 - 19;
function nCDL(C : ProjPointType<bigint>, end : bigint) : string {

    const Point = bn254.ProjectivePoint;
    const base = Point.BASE;
    //const xplookup = JSON.parse(fs.readFileSync('../../lookupTables/x19xlookupTable.json'));
    
  for (let xlo=BigInt(0); xlo< end; xlo++) {

    let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);  
      
      if (lookupTable.hasOwnProperty(key)) {
        
          console.log("ST number of iterations: ", xlo); 
          return  (xlo + (BigInt(2)**BigInt(pc)) * BigInt('0x' + lookupTable[key])).toString()         
      }       
  }           
} 

const Point = bn254.ProjectivePoint;
const base = Point.BASE;


const b32 = bn254.CURVE.randomBytes(4);
const secret = BigInt('0x' + Buffer.from(b32).toString('hex'));
const C = base.multiplyUnsafe(secret);
const xplookup = JSON.parse(fs.readFileSync('../../lookupTables/x19xlookupTable.json'));
const end = BigInt(2)**BigInt(pc);

// const px = 21861956719291866221604174723682514175270651772775071476198080719322268507641n;
// const py = 19497650904481789946494035020771121163438011375796074670837656115145665136295n;
// const pz = 1654506419357318237849648350088485442455696499154320619126418947898150698115n;

// const C_fixed = new Point(px, py, pz);
const numWorkers = 4;

console.time('Single Thread Computation');
const dec = nCDL(C,end);
console.log('ST result: ',dec);
console.timeEnd('Single Thread Computation');

const chunk = Number(end) / numWorkers;
//let chunks = [chunk*2, chunk*2, chunk, chunk, chunk, chunk];
let workers = [];

console.time('Threaded Computation');
console.time('worker creation time: ');
for (let i = 0; i < numWorkers; i++) {
  workers.push(new Worker('./worker.ts', 
    { workerData: { 
      start: i * chunk, 
      end: (i + 1) * chunk,
      table: lookupTable,  
      C_Hex: C.toHex() 
      } 

    }));
}
console.timeEnd('worker creation time: ');

let result = [];

workers.forEach(worker => {
  
  worker.once('message', msg => {
      
    result.push(msg);
    workers.forEach(w => w.terminate());
    console.log(`Worker with id ${worker.threadId} found the result: ${msg}`);
    console.log("secret: ",secret.toString());
    console.log('Threaded result: ',result[0]);
    console.timeEnd('Threaded Computation');
        
  });
  
});

