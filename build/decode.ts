import { bn254 } from './noble_bn254'; 
import { ProjPointType } from './abstract/weierstrass';
import { fetch_table } from './fetch_table';

export {decode, encode, split64};

const Point = bn254.ProjectivePoint;
const base = Point.BASE;
let lookupTable;

/**
 * Computes Discrete Log for Decoding
 * @param C encoded message --> C = [x]G 
 * @param pc the size of the lookup table to be used --> 2^pc // pc = 19 for default single thread
 * @returns decoded message x from [x]G
 */

function decode(C : ProjPointType<bigint>, pc : number) : bigint {
  
    /* The first time decode is called, it will call fetch_table() and store the lookupTable variable. 
       Subsequent calls to fetchTable() will use the table stored in the lookupTable variable, rather than calling functionA again.
       This will save the time from reading the lookupTable whenever decode is called again
     */
    if (!lookupTable) {
        lookupTable = fetch_table(pc);
    }  

    const n = 32 - pc;                                       
    const end = BigInt(2)**BigInt(pc);
    
    for (let xlo=BigInt(0); xlo< end; xlo++) {

        let key = C.subtract(base.multiplyUnsafe(xlo)).toAffine().x.toString(16);  
        
        if (lookupTable.hasOwnProperty(key)) {

        return  (xlo + (BigInt(2)**BigInt(n)) * BigInt('0x' + lookupTable[key]))        
        }       
    }           
} 

function encode(x : bigint) : ProjPointType<bigint> {
    
    if (x <= BigInt(2)**BigInt(32)) {
        return base.multiply(x)
    }  
    else throw new Error('The input should be 32-bit bigint')
    
}
// xlo and xhi merging  verification 

function split64(x : bigint) : [bigint, bigint] {
    
    function padBin(x:string) {
        return '0'.repeat(64 - x.length) + x;
    }
    const limit = BigInt(2)**BigInt(64n);
        
    if ( x <= limit) {
        
        const bin64 = padBin(x.toString(2));
    
        const xhi = '0b' + bin64.substring(0,32);   // the first 32 bits 
        const xlo = '0b' + bin64.substring(32,64);  // the last 32 bits  
    
        return [BigInt(xlo), BigInt(xhi)]
    }
    else throw new Error('The input should be 64-bit bigint')
    
}
// const plaintext = 1651651n;
// const C = encode(plaintext);
// console.log('plaintext: ', plaintext);
// console.log('C point:', C.toAffine());
// console.time('decoding');
// const x = decode(C,19);
// console.log('encoded text: ',x);
// console.timeEnd('decoding');


// const plaintext = 1651651n;
// const [xhi, xlo] = split64(plaintext);
// console.log('Split successful: ',(xlo + 2n**32n*xhi) == plaintext);