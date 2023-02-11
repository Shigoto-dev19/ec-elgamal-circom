// const { workerData, isMainThread, parentPort } = require('worker_threads');
// const bn254 = require('../noble_bn254').bn254;
// const ProjPointType = require('../abstract/weierstrass').ProjPointType;
// const fs = require('fs');
// //const fetch_table = require('../fetch_table').fetch_table;
// const Point = bn254.ProjectivePoint;
// const base = Point.BASE;
// //console.time('Threaded Computation');

// let { start, end, table, C_Hex } = workerData;
// const C = bn254.ProjectivePoint.fromHex(C_Hex); 


// for (let xlo = BigInt(start); xlo < BigInt(end); xlo++) {

//   let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);  
  
//   if (table.hasOwnProperty(key)) {

//     console.log("\nT number of iterations: ", xlo); 
//     parentPort.postMessage((xlo + (BigInt(2)**BigInt(13)) * BigInt('0x' + table[key])).toString());
//     parentPort.close();
//     break;
//   }       
// }
// //console.timeEnd('Threaded Computation');

// /*
// function nCDL(C : ProjPointType<bigint>, end : bigint) : string {

//     const Point = bn254.ProjectivePoint;
//     const base = Point.BASE;
//     const xplookup = JSON.parse(fs.readFileSync('../../../xp16xlookup-table.json'));
    
//   for (let xlo=BigInt(0); xlo< end; xlo++) {

//     let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);  
      
//       if (xplookup.hasOwnProperty(key)) {
//           //console.log(`Key "${key}" found with value: ${obj[key]}`);
//           console.log("number of iterations: ", xlo); 
//           return  (xlo + (BigInt(2)**BigInt(16)) * BigInt('0x' + xplookup[key])).toString()
          
//       }       
//   }           
// }     
 
// parentPort.postMessage(
//   nCDL(bn254.ProjectivePoint.fromHex(workerData.value), BigInt('0x' + workerData.end))
// );
// */