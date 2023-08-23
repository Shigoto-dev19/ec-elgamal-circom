import { getRandomPoint, getInRange } from "../build/elgamal";
import { bn254 } from '../build/noble_bn254'; 

const snarkjs = require('snarkjs');
const fs = require('fs');
const expect = require("chai").expect;

export {snarkjs, expect, fs, bn254, getRandomPoint, getInRange};

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;
//const curve = bn254.CURVE;
//const fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; 

describe('Point Addition Circuit Tests', () => {

    let wasm_path = "./circuits/artifacts/addPoint_test/addPoint.wasm";
    let zkey_path = "./circuits/artifacts/addPoint_test/addPoint.zkey";
    
   
    it('Verify addPoint circuit', async () => {

        const input = ({"p1": [5,10], "p2": [1,2]});

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        const vKey = JSON.parse(fs.readFileSync("./circuits/artifacts/addPoint_test/addPoint.vkey.json"));
        
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);    
    });

    
    it("Verify compliant output", async() => {
        
        const input = ({"p1": [
                               "9576106256429682909732802513550057851239909425182015025367964331626916216831",
                               "3762041743597375428823600987466094155844250131321505902823128844567717085184"
                              ],
                        "p2": ["1","2"]
                       });
       
        const p1 =  new Point(
                              9576106256429682909732802513550057851239909425182015025367964331626916216831n, 
                              3762041743597375428823600987466094155844250131321505902823128844567717085184n,
                              1n
                             );
        const p2 =  new Point(1n, 2n, 1n);
        const addRes = p1.add(p2).toAffine();

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());
    });

    it("Verify false different input is invalid", async() => {
        
        const input = ({"p1": [5,10], "p2": [1,2]});
        const p1 =  new Point(1n, 4n, 1n);
        const p2 =  new Point(5n, 10n, 1n);
        const addRes = p1.add(p2).toAffine();
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        expect(publicSignals[0]).not.equals(addRes.x.toString());
        expect(publicSignals[1]).not.equals(addRes.y.toString());  
    });


    it("Verify adding two differnt random points", async() => {
         
        const P1 = getRandomPoint();
        const P2 = getRandomPoint();
        
        const addRes = P1.add(P2).toAffine();
        
        const input = {"p1": [P1.toAffine().x.toString(), P1.toAffine().y.toString()], 
                       "p2": [P2.toAffine().x.toString(), P2.toAffine().y.toString()]};
    
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());
    });

    it("Verify adding same random point returns double", async() => {
         
        const P = getRandomPoint();
        const doubleRes = P.double().toAffine();

        const input = {
                       "p1": [P.toAffine().x.toString(), P.toAffine().y.toString()], 
                       "p2": [P.toAffine().x.toString(), P.toAffine().y.toString()]
                      };
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
    
    });

    it("Verify adding random point to the IDENTITY point returns the same point", async() => {
         
        const P1 = getRandomPoint();
        const P2 = Point.ZERO;
        
        const input = {
                       "p1": [P1.toAffine().x.toString(), P1.toAffine().y.toString()],
                       "p2": [P2.toAffine().x.toString(), P2.toAffine().y.toString()]
                      };
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(P1.toAffine().x.toString());
        expect(publicSignals[1]).to.equals(P1.toAffine().y.toString());     

    });

    it("Verify adding two IDENTITY points returns the IDENTITY point ", async() => {
         
        const P = Point.ZERO;
        
        const addRes = P.add(P).toAffine();
        
        const input = {
                       "p1": [P.toAffine().x, P.toAffine().y], 
                       "p2": [P.toAffine().x, P.toAffine().y]
                      };
      
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(addRes.x.toString());
        expect(publicSignals[1]).to.equals(addRes.y.toString());  
    });

    it("Verify adding a random point to its NEGATE returns the IDENTITY point ", async() => {
         
        const ZERO = Point.ZERO.toAffine();
        const P1 = getRandomPoint()
        const P2 = P1.negate();
    
        const input = {"p1": [P1.toAffine().x.toString(), P1.toAffine().y.toString()], "p2": [P2.toAffine().x.toString(), P2.toAffine().y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(ZERO.x.toString());
        expect(publicSignals[1]).to.equals(ZERO.y.toString());  
    });

    it("Verify looped random point addition", async() => {
         
        for (let i=0; i < 10; i++) {

            const P1 = getRandomPoint();
            const P2 = getRandomPoint();
            const addRes = P1.add(P2).toAffine();
            
            const input = {
                           "p1": [P1.toAffine().x.toString(), P1.toAffine().y.toString()], 
                           "p2": [P2.toAffine().x.toString(), P2.toAffine().y.toString()]
                          };
            
            const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(addRes.x.toString());
            expect(publicSignals[1]).to.equals(addRes.y.toString());
        }
        
    });

});



