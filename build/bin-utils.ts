import * as binFileUtils from "@iden3/binfileutils";
import { getInRange, Point, mod } from "./alt_bn128";
import * as bigInt from 'big-integer';
const fs = require('fs');
function padKey(key: string) {
    return '0'.repeat(64 - key.length) + key
}
function padValue(value: string) {
    return '0'.repeat(4 - value.length) + value
}
const G = new Point(1,2);

export async function writeBIN(fileName) {

    const fd = await binFileUtils.createBinFile(fileName,"zkey", 1, 2);

    // Write the keys
    await binFileUtils.startWriteSection(fd, 1);
    
    for (let xhi = 0; xhi < 2**16; xhi++) {

        let key = padKey(G.multiplyDA(xhi * 2**16).x.toString(16));
        await fd.write(Buffer.from(key,"hex"));          
    }

    await binFileUtils.endWriteSection(fd);

    // Write the values
    await binFileUtils.startWriteSection(fd, 2);

    for (let xhi = 0; xhi < 2**16; xhi++) {

        let value = padValue(xhi.toString(16));
        await fd.write(Buffer.from(value,"hex"));
    }
    await binFileUtils.endWriteSection(fd);

    await fd.close();
}

//writeBIN("x16Hashmap.bin").then(() => {}) ;


export async function readBIN(fileName) {

    const {fd, sections} = await binFileUtils.readBinFile(fileName,"zkey", 1);


    // Read Keys

    await binFileUtils.startReadUniqueSection(fd, sections, 1);
    let keys = [];
    for (let i=0; i<2**16; i++) {
        let key = await fd.read(32);
        keys.push(Buffer.from(key,'hex'));
    }
    await binFileUtils.endReadSection(fd);


    // Read Values
   
    await binFileUtils.startReadUniqueSection(fd, sections, 2);
    let values = [];
    for (let i=0; i<2**16; i++) {
        let value = await fd.read(2);
        values.push(Buffer.from(value,'hex').toString('hex'));
    }
    await binFileUtils.endReadSection(fd);

    await fd.close();

    return [keys,values];

}
function isIncluded(buffer, bufferArray) {
    return bufferArray.some(b => buffer.compare(b) === 0);
  }
console.time("offline");
readBIN("../x16Hashmap.bin").then((result) => {

    const key = "0152a78fcd7c852c6d639fe3952ba4ad8f8d0328b1fc4838271b64e456ea9a5e";
    const buff = Buffer.from(key,'hex');
    console.log('key is included: ',isIncluded(buff,result[0]))
    console.log("values: ",result[1]);
    //console.log("keys: ",result[0]);
    
    
    const G = new Point(1,2);

    // const r = bigInt(getInRange(1,bigInt(2).pow(32)));
    // console.log("secret number: ",r);
    // const C = G.multiplyDA(r);
    // let s = 0;

    // const start = performance.now();
    // for (let xlo=0; xlo<2**16; xlo++) {
        
    //     let key = C.add(G.multiplyDA(xlo).negate()).x.toString(16);
    //     key = Buffer.from(padKey(key),'hex');
        
    //     if (isIncluded(buff,result[0])==true) {
            
    //         //console.log("number of iterations: ", xlo); 
    //         s = xlo + 2**16 * bigInt(result[1][xlo],16).toJSNumber() 
    //     } 
    // }

    // const end = performance.now();
    // const time = (end - start) / 1000;

    // console.log("decoded: ",s, `Time elapsed: ${time.toFixed(2)} seconds`);
    
})
console.timeEnd("offline");

//const G = new Point(1,2);

const r = bigInt(getInRange(1,bigInt(2).pow(32)));
console.log("secret number: ",r);
const C = G.multiplyDA(r);
let s = 0;
/*
console.time("compute");
for (let xlo=0; xlo<2**16; xlo++) {
    
    let key = C.add(G.multiplyDA(xlo).negate()).x.toString(16);
    key = Buffer.from(padKey(key),'hex');
}
const end = performance.now();
console.timeEnd("compute");
*/

const binfile = fs.readFileSync("x16Hashmap.bin");