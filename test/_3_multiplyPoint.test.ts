import {snarkjs, expect, fs, bn128} from "./_2_addPoint.test";
import { curve } from "../build/alt_bn128";

describe('Scalar Multiplication Circuit Tests', () => {

    let wasm_path = "./artifacts/multiplyPoint/multiplyPoint.wasm";
    let zkey_path = "./artifacts/multiplyPoint/multiplyPoint.zkey";
    const input = ({"p": [1,2], "c":25});
   
    it('Verify scalar multiplication circuit', async() => {

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        const vKey = JSON.parse(fs.readFileSync("./artifacts/multiplyPoint_test.vkey.json"));
        
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);    

    });

    it("Verify compliant output", async() => {
        
        const p =  new bn128.Point(1,2);
        const multRes = p.multiplyDA(25);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        
        expect(publicSignals[0]).to.equals(multRes.x.toString());
        expect(publicSignals[1]).to.equals(multRes.y.toString());
        
    });

    it("Verify false output is invalid", async() => {
        
        const p =  new bn128.Point(1,2);
        const multRes = p.multiplyDA(24);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).not.equals(multRes.x.toString());
        expect(publicSignals[1]).not.equals(multRes.y.toString()); 
        
    });

    it("Verify returning IDENTITY when multiplied by zero", async() => {
        
        const P = new bn128.Point(1,2);
        const multRes = P.multiplyDA(0);
        const input = {"p": [P.x, P.y], "c": 0};

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).to.equals(multRes.x.toString());
        expect(publicSignals[1]).to.equals(multRes.y.toString());  
        
    });

    it("Verify returning the same random point when multiplied by one", async() => {
        
        const P = bn128.getRandomPoint();
        const input = {"p": [P.x.toString(), P.y.toString()], "c": 1};

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).to.equals(P.x.toString());
        expect(publicSignals[1]).to.equals(P.y.toString());  
        
    });

    it("Verify multiply random point with random coefficient", async() => {
         
        const P = bn128.getRandomPoint();
        const c = bn128.getInRange(1, curve.n).toString();

        const multRes = P.multiplyDA(c);
        const input = {"p": [P.x.toString(), P.y.toString()], "c": c.toString()};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(multRes.x.toString());
        expect(publicSignals[1]).to.equals(multRes.y.toString());
        
    });


    it("Verify looped random point scalar multiplication", async() => {
         
        for (let i=0; i < 10; i++) {

            const P = new bn128.Point(1,2);
            const c = bn128.getInRange(1, curve.n).toString();

            const multRes = P.multiplyDA(c);
            const input = {"p": [P.x.toString(), P.y.toString()], "c":c.toString()};
            
            const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(multRes.x.toString());
            expect(publicSignals[1]).to.equals(multRes.y.toString());
        }
        
    });

});

