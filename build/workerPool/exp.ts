import { bn254 } from '../noble_bn254'; 
import { ProjPointType } from '../abstract/weierstrass';
const fs = require('fs');

const Point = bn254.ProjectivePoint;
const base = Point.BASE;
const b32 = bn254.CURVE.randomBytes(4);
const secret = BigInt('0x' + Buffer.from(b32).toString('hex'));
const C = base.multiplyUnsafe(secret);
//console.log("cipher point: ", C);
const xplookup = JSON.parse(fs.readFileSync('../../lookupTables/xp17xlookup-table.json'));
const end = BigInt(2)**BigInt(15);

console.time('Max Computation time for pre-2^17');

for (let xlo = BigInt(0); xlo < BigInt(end); xlo++) {

  let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);  
  let res = xplookup.hasOwnProperty(key);
//   if (xplookup.hasOwnProperty(key)) {

//     console.log("\nT number of iterations: ", xlo); 
//     console.log((xlo + (BigInt(2)**BigInt(16)) * BigInt('0x' + xplookup[key])).toString());
//     break;
//   }       
}
console.timeEnd('Max Computation time for pre-2^17');
const px = 21861956719291866221604174723682514175270651772775071476198080719322268507641n;
const py = 19497650904481789946494035020771121163438011375796074670837656115145665136295n;
const pz = 1654506419357318237849648350088485442455696499154320619126418947898150698115n;

//const C_Hex = new Point(px, py, pz);
