import { getRandomPoint } from "../build/alt_bn128";

const snarkjs = require('snarkjs');
const fs = require('fs');
const bn128  = require("../build/alt_bn128");
const expect = require("chai").expect;
export {snarkjs, expect, fs, bn128};


describe('Point Addition Circuit Tests', () => {

    let wasm_path = "./artifacts/addPoint/addPoint.wasm";
    let zkey_path = "./artifacts/addPoint/addPoint.zkey";
    const input = ({"p1": [1,2], "p2": [5,10]});
   
    it('Verify addPoint circuit', async () => {

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        const vKey = JSON.parse(fs.readFileSync("./artifacts/addPoint_test.vkey.json"));
        
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);    
    });

    
    it("Verify compliant output", async() => {
        
        const p1 =  new bn128.Point(1,2);
        const p2 =  new bn128.Point(5,10);
        const addRes = p1.add(p2);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());
    });

    it("Verify false output is invalid", async() => {
        
        const p1 =  new bn128.Point(5,10);
        const p2 =  new bn128.Point(1,4);
        const addRes = p1.add(p2);
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        expect(publicSignals[0]).not.equals(addRes.x.toString());
        expect(publicSignals[1]).not.equals(addRes.y.toString());  
    });


    it("Verify adding two differnt random points", async() => {
         
        const P1 = bn128.getRandomPoint();
        const P2 = bn128.getRandomPoint();
        
        const addRes = P1.add(P2);
        const input = {"p1": [P1.x.toString(), P1.y.toString()], "p2": [P2.x.toString(), P2.y.toString()]};
    
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());
    });

    it("Verify adding same random point returns double", async() => {
         
        const P = bn128.getRandomPoint();
        const doubleRes = P.double();
        const input = {"p1": [P.x.toString(), P.y.toString()], "p2": [P.x.toString(), P.y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
    
    });

    it("Verify adding random point to the IDENTITY point returns the same point", async() => {
         
        const P1 = bn128.getRandomPoint();
        const P2 = new bn128.Point(0,0);
        
        const input = {"p1": [P1.x.toString(), P1.y.toString()], "p2": [P2.x.toString(), P2.y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(P1.x.toString());
        expect(publicSignals[1]).to.equals(P1.y.toString());     

    });

    it("Verify adding two IDENTITY points returns the IDENTITY point ", async() => {
         
        const P = new bn128.Point(0,0);
        
        const addRes = P.add(P);
        const input = {"p1": [P.x, P.y], "p2": [P.x, P.y]};
      
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());  
    });

    it("Verify adding a random point to its NEGATE returns the IDENTITY point ", async() => {
         
        const ZERO = new bn128.Point(0,0);
        const P1 = getRandomPoint()
        const P2 = P1.negate();
        //const addRes = P1.add(P2);
        const input = {"p1": [P1.x.toString(), P1.y.toString()], "p2": [P2.x.toString(), P2.y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(ZERO.x.toString());
        expect(publicSignals[1]).to.equals(ZERO.y.toString());  
    });

    it("Verify looped random point addition", async() => {
         
        for (let i=0; i < 10; i++) {

            const P1 = bn128.getRandomPoint();
            const P2 = bn128.getRandomPoint();
            const addRes = P1.add(P2);
            const input = {"p1": [P1.x.toString(), P1.y.toString()], "p2": [P2.x.toString(), P2.y.toString()]};
            
            const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(addRes.x.toString());
            expect(publicSignals[1]).to.equals(addRes.y.toString());
        }
        
    });

});



