import {snarkjs, expect, fs, bn254, getRandomPoint, getInRange} from "./1_addPoint.test";

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;
const fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; 

describe.skip('Scalar Multiplication Circuit Tests', () => {

    let wasm_path = "./circuits/artifacts/multiplyPoint_test/multiplyPoint.wasm";
    let zkey_path = "./circuits/artifacts/multiplyPoint_test/multiplyPoint.zkey";
    const input = ({"p": [1,2], "c":25});
   
    it('Verify scalar multiplication circuit', async() => {

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        const vKey = JSON.parse(fs.readFileSync("./circuits/artifacts/multiplyPoint_test/multiplyPoint.vkey.json"));
        
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);    

    });

    it("Verify compliant output", async() => {
        
        const multRes = G.multiply(25n).toAffine();

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        
        expect(publicSignals[0]).to.equals(multRes.x.toString());
        expect(publicSignals[1]).to.equals(multRes.y.toString());
        
    });

    it("Verify false input is invalid", async() => {
        
        const multRes = G.multiply(24n).toAffine();

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).not.equals(multRes.x.toString());
        expect(publicSignals[1]).not.equals(multRes.y.toString()); 
        
    });

    it("Verify returning IDENTITY when multiplied by zero", async() => {
        
        const P = getRandomPoint();
       
        const input = {"p": [P.toAffine().x, P.toAffine().y], "c": 0};

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).to.equals('0');
        expect(publicSignals[1]).to.equals('0');  
        
    });

    it("Verify returning the same random point when multiplied by one", async() => {
        
        const P = getRandomPoint().toAffine();
        const input = {"p": [P.x.toString(), P.y.toString()], "c": 1};

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

        expect(publicSignals[0]).to.equals(P.x.toString());
        expect(publicSignals[1]).to.equals(P.y.toString());  
        
    });

    it("Verify multiply random point with random coefficient", async() => {
         
        const P = getRandomPoint();
        const c = getInRange(1n, fp);

        const multRes = P.multiply(c).toAffine();
        const input = {"p": [P.toAffine().x.toString(), P.toAffine().y.toString()], "c": c.toString()};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(multRes.x.toString());
        expect(publicSignals[1]).to.equals(multRes.y.toString());
        
    });


    it("Verify looped random point scalar multiplication", async() => {
         
        for (let i=0; i < 10; i++) {

            let P = getRandomPoint();
            let c = getInRange(1n, fp);

            let multRes = P.multiply(c).toAffine();
            let input = {"p": [P.toAffine().x.toString(), P.toAffine().y.toString()], "c":c.toString()};
            
            let { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(multRes.x.toString());
            expect(publicSignals[1]).to.equals(multRes.y.toString());
        }
        
    });

});

