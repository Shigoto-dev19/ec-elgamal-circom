
import {snarkjs, expect, fs, bn254, getRandomPoint} from "./1_addPoint.test";

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;

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
        
        const doubleRes = G.double().toAffine();

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
    });

    it("Verify false input is invalid", async() => {
        
        const p =  new Point(
                             9576106256429682909732802513550057851239909425182015025367964331626916216831n, 
                             3762041743597375428823600987466094155844250131321505902823128844567717085184n,
                             1n
                            );
        
        const doubleRes = p.double().toAffine();
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
        expect(publicSignals[0]).not.equals(doubleRes.x.toString());
        expect(publicSignals[1]).not.equals(doubleRes.y.toString());  
    });

    it("Verify doubling a random point", async() => {
         
        const P = getRandomPoint();
        
        const doubleRes = P.double().toAffine();
        const input = {"p": [P.toAffine().x.toString(), P.toAffine().y.toString()]};
        
        const { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
        expect(publicSignals[0]).to.equals(doubleRes.x.toString());
        expect(publicSignals[1]).to.equals(doubleRes.y.toString());
        
    });

    it("Verify looped doubling a random point", async() => {
         
        for (let i=0; i < 10; i++) {

            let P = getRandomPoint();

            let doubleRes = P.double().toAffine();
            let input = {"p": [P.toAffine().x.toString(), P.toAffine().y.toString()]};
            
            let { proof, publicSignals} = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);
            expect(publicSignals[0]).to.equals(doubleRes.x.toString());
            expect(publicSignals[1]).to.equals(doubleRes.y.toString());
        }
    });
});

