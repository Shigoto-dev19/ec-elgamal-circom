
import {snarkjs, expect, fs, bn128} from "./_2_addPoint.test";

describe('Double Point Circuit Tests', () => {

    let wasm_path = "./artifacts/doublePoint/doublePoint.wasm";
    let zkey_path = "./artifacts/doublePoint/doublePoint.zkey";
    const input = ({"p": [1,2]});
   
    it('Verify doublePoint circuit', async () => {

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        const vKey = JSON.parse(fs.readFileSync("./artifacts/doublePoint_test.vkey.json"));
        
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);    
    });

    it("Verify compliant output", async() => {
        
        const p =  new bn128.Point(1,2);
        const doubleRes = p.double();

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
    });

    it("Verify false output is invalid", async() => {
        
        const p =  new bn128.Point(5,10);
        
        const doubleRes = p.double(p);
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        expect(publicSignals[0]).not.equals(doubleRes.x.toString());
        expect(publicSignals[1]).not.equals(doubleRes.y.toString());  
    });

    it("Verify doubling a random point", async() => {
         
        const P = bn128.getRandomPoint();
        
        const doubleRes = P.double();
        const input = {"p": [P.x.toString(), P.y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
        
    });

    it("Verify looped doubling a random point", async() => {
         
        for (let i=0; i < 10; i++) {

            let P = bn128.getRandomPoint();

            let doubleRes = P.double();
            let input = {"p": [P.x.toString(), P.y.toString()]};
            
            let { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(doubleRes.x.toString());
            expect(publicSignals[1]).to.equals(doubleRes.y.toString());
        }
    });
});

