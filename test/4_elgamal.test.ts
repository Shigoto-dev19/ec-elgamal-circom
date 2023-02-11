import {snarkjs, expect, fs, bn254, getRandomPoint, getInRange} from "./1_addPoint.test";
import { encrypt_s, encrypt, decrypt, key_pair } from "../build/elgamal";

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;
const fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; 

describe('Testing Noble ElGamal Scheme Circuits\n', () => {


    context('Testing Encrypt Circuit', () => {

        let wasm_path = "./artifacts/encrypt/encrypt.wasm";
        let zkey_path = "./artifacts/encrypt/encrypt.zkey";
        const input = JSON.parse(fs.readFileSync("./circuits/inputs/encrypt.json"));
    
        it('Verify Encrypt circuit', async() => {

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            const vKey = JSON.parse(fs.readFileSync("./artifacts/encrypt_test.vkey.json"));
            
            //console.log(publicSignals);
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            expect(res).to.equal(true);    

        });

        it("Verify compliant encrypt output", async() => {
            
            const M =  new Point( 
                                 13450012539541402417650409815647907927966056307197568677460170196993210596140n,
                                 8699579716453960110361139739192116897095303157908903021575208968744512060929n, 
                                 1n
                                );
            
            const k = 20425139242514079777375617959215631491960524925907990926085008602062350969470n;
            const pk = new Point(
                                 1981511256345776401929196306827216354002147912780445787878216743189191373498n,
                                 11467959124775609891367919563261775656855621164702429578883304328862640213853n,
                                 1n
                                );
            const [ephemeral_key, encrypted_message] = encrypt_s(M, pk, k);

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            
            // Verify compliant encryption output for the ephemeral key
            expect(publicSignals[0]).to.equals(ephemeral_key.toAffine().x.toString());
            expect(publicSignals[1]).to.equals(ephemeral_key.toAffine().y.toString());
            // Verify compliant encryption output for the encrypted message
            expect(publicSignals[2]).to.equals(encrypted_message.toAffine().x.toString());
            expect(publicSignals[3]).to.equals(encrypted_message.toAffine().y.toString());
            // Verify compliant encryption input for public key
            expect(publicSignals[4]).to.equals(pk.toAffine().x.toString());
            expect(publicSignals[5]).to.equals(pk.toAffine().y.toString());
            
        });

        it("Verify false encrypt output is invalid", async() => {
            
            const M =  new Point( 
                                 13450012539541402417650409815647907927966056307197568677460170196993210596140n,
                                 8699579716453960110361139739192116897095303157908903021575208968744512060929n, 
                                 1n
                                );
            
            const k = 20425139242514079777375617959215631491960524925907990926085008602062350969471n;              // only the nonce key is changed
            const pk = new Point(
                                 1981511256345776401929196306827216354002147912780445787878216743189191373498n,
                                 11467959124775609891367919563261775656855621164702429578883304328862640213853n,
                                 1n
                                );
            const [ephemeral_key, encrypted_message] = encrypt_s(M, pk, k);

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            
            // Verify false encryption output for the ephemeral key
            expect(publicSignals[0]).not.equals(ephemeral_key.toAffine().x.toString());
            expect(publicSignals[1]).not.equals(ephemeral_key.toAffine().y.toString());
            // Verify false encryption output for the encrypted message
            expect(publicSignals[2]).not.equals(encrypted_message.toAffine().x.toString());
            expect(publicSignals[3]).not.equals(encrypted_message.toAffine().y.toString());
            // Verify compliant encryption input for public key
            expect(publicSignals[4]).to.equals(pk.toAffine().x.toString());
            expect(publicSignals[5]).to.equals(pk.toAffine().y.toString()); 
            
        });

        it("Verify compliant encrypt output for random inputs", async() => {
            
            const [private_key, public_key] = key_pair();
            const [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
            
            const input = {
                "M" : [M.toAffine().x.toString(), M.toAffine().y.toString()],
                "k" : k.toString(),
                "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
            };

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

            // Verify compliant encryption output for the ephemeral key
            expect(publicSignals[0]).to.equals(ephemeral_key.toAffine().x.toString());
            expect(publicSignals[1]).to.equals(ephemeral_key.toAffine().y.toString());
            // Verify compliant encryption output for the encrypted message
            expect(publicSignals[2]).to.equals(encrypted_message.toAffine().x.toString());
            expect(publicSignals[3]).to.equals(encrypted_message.toAffine().y.toString());
            // Verify compliant encryption input for public key
            expect(publicSignals[4]).to.equals(public_key.toAffine().x.toString());
            expect(publicSignals[5]).to.equals(public_key.toAffine().y.toString());  
            
        });

        it("Looped: Verify compliant encrypt output for random inputs", async() => {
            
            for (let i=0; i<5; i++) {
                
                let [private_key, public_key] = key_pair();
                let [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
                
                let input = {
                    "M" : [M.toAffine().x.toString(), M.toAffine().y.toString()],
                    "k" : k.toString(),
                    "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
                };

                let { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

                // Verify compliant encryption output for the ephemeral key
                expect(publicSignals[0]).to.equals(ephemeral_key.toAffine().x.toString());
                expect(publicSignals[1]).to.equals(ephemeral_key.toAffine().y.toString());
                // Verify compliant encryption output for the encrypted message
                expect(publicSignals[2]).to.equals(encrypted_message.toAffine().x.toString());
                expect(publicSignals[3]).to.equals(encrypted_message.toAffine().y.toString());
                
            }   
        });
    })


    context('Testing Decrypt Circuit', () => {
        
        let wasm_path = "./artifacts/decrypt/decrypt.wasm";
        let zkey_path = "./artifacts/decrypt/decrypt.zkey";
        const input = JSON.parse(fs.readFileSync("./circuits/inputs/decrypt.json"));
    
        it('Verify Decrypt circuit', async() => {

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            const vKey = JSON.parse(fs.readFileSync("./artifacts/decrypt_test.vkey.json"));
            
            //console.log(publicSignals);
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            expect(res).to.equal(true);    

        });

        it("Verify compliant decrypt output", async() => {
            
            const eM = new Point(                                                                                   // sender's encrypted message 
                                 4212279294734244908023071031365765496725186939203780133077169278238922244536n,
                                 13156242580345962573407240190763798938422253950891975742714032305873247356795n, 
                                 1n
                                );
            
            const ke = new Point(                                                                                   // sender's ephemeral key
                                 12214684440684369844952662188364381889344660032064932673547822089795142626551n,
                                 5521381057116560431176513205695032228668755393136531321560154194489173701703n,
                                 1n
                                );
            
            const d = 13937760274472313258011928340597923491763822246075385565136729270135485939226n;               // private key
            
            const dM = decrypt(d, ke, eM);

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            
            // Verify compliant decryption output of the decrypted message
            expect(publicSignals[0]).to.equals(dM.toAffine().x.toString());
            expect(publicSignals[1]).to.equals(dM.toAffine().y.toString());
            
            // Verify compliant decryption input for the encrypted message
            expect(publicSignals[2]).to.equals(eM.toAffine().x.toString());
            expect(publicSignals[3]).to.equals(eM.toAffine().y.toString());
            
        });

        it("Verify false decrypt output is invalid", async() => {
            
            const eM = new Point(                                                                                   // only sender's encrypted message is changed
                                 4212279294734244908023071031365765496725186939203780133077169278238922244537n,
                                 13156242580345962573407240190763798938422253950891975742714032305873247356793n, 
                                 1n
                                );
            
            const ke = new Point(                                                                                   // sender's ephemeral key
                                 12214684440684369844952662188364381889344660032064932673547822089795142626551n,
                                 5521381057116560431176513205695032228668755393136531321560154194489173701703n,
                                 1n
                                );
                            
            const d = 13937760274472313258011928340597923491763822246075385565136729270135485939226n;               // private key
            
            const dM = decrypt(d, ke, eM);

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  
            
            // Verify false decryption output of the decrypted message
            expect(publicSignals[0]).not.equals(dM.toAffine().x.toString());
            expect(publicSignals[1]).not.equals(dM.toAffine().y.toString());
            
            // Verify false decryption input for the encrypted message
            expect(publicSignals[2]).not.equals(eM.toAffine().x.toString());
            expect(publicSignals[3]).not.equals(eM.toAffine().y.toString());
            
        });

        it("Verify compliant decrypt output for random inputs", async() => {
            
            const [private_key, public_key] = key_pair();
            const [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
            
            const dM = decrypt(private_key, ephemeral_key, encrypted_message);
            
            const input = {
                "eM" : [encrypted_message.toAffine().x.toString(), encrypted_message.toAffine().y.toString()],
                "ke" : [ephemeral_key.toAffine().x.toString(), ephemeral_key.toAffine().y.toString()],
                "d"  : private_key.toString()
            };

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

            // Verify compliant decryption output of the decrypted message
             expect(publicSignals[0]).to.equals(dM.toAffine().x.toString());
             expect(publicSignals[1]).to.equals(dM.toAffine().y.toString());
             
            // Verify compliant decryption input for the encrypted message
             expect(publicSignals[2]).to.equals(encrypted_message.toAffine().x.toString());
             expect(publicSignals[3]).to.equals(encrypted_message.toAffine().y.toString());

            // Verify decrypted message is compliant to the original message
             expect(publicSignals[0]).to.equals(M.toAffine().x.toString());
             expect(publicSignals[1]).to.equals(M.toAffine().y.toString());
        });

        it("Looped: Verify compliant decrypt output for random inputs", async() => {
            
            for (let i=0; i<5; i++) {

                let [private_key, public_key] = key_pair();
                let [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
                
                let dM = decrypt(private_key, ephemeral_key, encrypted_message);
                
                let input = {
                    "eM" : [encrypted_message.toAffine().x.toString(), encrypted_message.toAffine().y.toString()],
                    "ke" : [ephemeral_key.toAffine().x.toString(), ephemeral_key.toAffine().y.toString()],
                    "d"  : private_key.toString()
                };

                let { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm_path, zkey_path);  

                // Verify compliant decryption output of the decrypted message
                expect(publicSignals[0]).to.equals(dM.toAffine().x.toString());
                expect(publicSignals[1]).to.equals(dM.toAffine().y.toString());
                
                // Verify compliant decryption input for the encrypted message
                expect(publicSignals[2]).to.equals(encrypted_message.toAffine().x.toString());
                expect(publicSignals[3]).to.equals(encrypted_message.toAffine().y.toString());

                // Verify decrypted message is compliant to the original message
                expect(publicSignals[0]).to.equals(M.toAffine().x.toString());
                expect(publicSignals[1]).to.equals(M.toAffine().y.toString());
            }
        });
    })
        
        context('Testing compliance of Encrypt/Decrypt circuits', () => {

            it("Verify the circuits according to the given JSON inputs", async () => {

                const wasm_path_encrypt = "./artifacts/encrypt/encrypt.wasm";
                const zkey_path_encrypt = "./artifacts/encrypt/encrypt.zkey";
                const input_encrypt = JSON.parse(fs.readFileSync("./circuits/inputs/encrypt.json"));
                

                const wasm_path_decrypt = "./artifacts/decrypt/decrypt.wasm";
                const zkey_path_decrypt = "./artifacts/decrypt/decrypt.zkey";
                const input_decrypt_json = JSON.parse(fs.readFileSync("./circuits/inputs/decrypt.json"));
                
                // This function is used to avoid block-redeclaration error
                async function getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt) {                                                                                                    

                    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                    return publicSignals;
                }
                
                const publicSignals_encrypt = await getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                
                const input_decrypt = {
                    "eM" : [publicSignals_encrypt[2], publicSignals_encrypt[3]],
                    "ke" : [publicSignals_encrypt[0], publicSignals_encrypt[1]],
                    "d"  : input_decrypt_json.d
                };
                
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);

                expect(publicSignals[0]).to.equals(input_encrypt.M[0]);
                expect(publicSignals[1]).to.equals(input_encrypt.M[1]);
            })

            it("Verify the circuits given random inputs", async () => {

                const [private_key, public_key] = key_pair();
                const [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
                
                // the input for the encrypt circuit is given randomly by the TS code 
                const input_encrypt = {
                    "M" : [M.toAffine().x.toString(), M.toAffine().y.toString()],
                    "k" : k.toString(),
                    "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
                };

                const wasm_path_encrypt = "./artifacts/encrypt/encrypt.wasm";
                const zkey_path_encrypt = "./artifacts/encrypt/encrypt.zkey";
                
                const wasm_path_decrypt = "./artifacts/decrypt/decrypt.wasm";
                const zkey_path_decrypt = "./artifacts/decrypt/decrypt.zkey";
                
                // This function is used to avoid block-redeclaration error
                async function getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt) {                                                                                                    

                    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                    return publicSignals;
                }
                
                const publicSignals_encrypt = await getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                
                // The input of the decrypt circuit is given by the output of the encrypt circuit
                const input_decrypt = {
                    "eM" : [publicSignals_encrypt[2], publicSignals_encrypt[3]],
                    "ke" : [publicSignals_encrypt[0], publicSignals_encrypt[1]],
                    "d"  : private_key.toString()
                };
                
                const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);

                expect(publicSignals[0]).to.equals(input_encrypt.M[0]);
                expect(publicSignals[1]).to.equals(input_encrypt.M[1]);
            })

            it("Looped Verify the circuits given random inputs", async () => {
                
                for (let i=0; i<5; i++) {

                    let [private_key, public_key] = key_pair();
                    let [M, ephemeral_key, encrypted_message, k] = encrypt(public_key);
                    
                    // the input for the encrypt circuit is given randomly by the TS code 
                    let input_encrypt = {
                        "M" : [M.toAffine().x.toString(), M.toAffine().y.toString()],
                        "k" : k.toString(),
                        "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
                    };
                    let wasm_path_encrypt = "./artifacts/encrypt/encrypt.wasm";
                    let zkey_path_encrypt = "./artifacts/encrypt/encrypt.zkey";
                    
                    let wasm_path_decrypt = "./artifacts/decrypt/decrypt.wasm";
                    let zkey_path_decrypt = "./artifacts/decrypt/decrypt.zkey";
                    
                    // This function is used to avoid block-redeclaration error
                    async function getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt) {                                                                                                    

                        let { proof, publicSignals } = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                        return publicSignals;
                    }
                    
                    let publicSignals_encrypt = await getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                    
                    // The input of the decrypt circuit is given by the output of the encrypt circuit
                    let input_decrypt = {
                        "eM" : [publicSignals_encrypt[2], publicSignals_encrypt[3]],
                        "ke" : [publicSignals_encrypt[0], publicSignals_encrypt[1]],
                        "d"  : private_key.toString()
                    };
                    
                    let { proof, publicSignals } = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);

                    expect(publicSignals[0]).to.equals(input_encrypt.M[0]);
                    expect(publicSignals[1]).to.equals(input_encrypt.M[1]);
                }
            })

            it("Verify the ElGamal homomorphic property of two random messages", async () => {

                const [private_key, public_key] = key_pair();
                const [M1, ephemeral_key1, encrypted_message1, k1] = encrypt(public_key);     // encrypt message M1
                const [M2, ephemeral_key2, encrypted_message2, k2] = encrypt(public_key);     // encrypt message M2  
                
                // the input for the encrypt circuit is given randomly by the TS code 
                const input_encrypt1 = {
                    "M" : [M1.toAffine().x.toString(), M1.toAffine().y.toString()],
                    "k" : k1.toString(),
                    "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
                };

                const input_encrypt2 = {
                    "M" : [M2.toAffine().x.toString(), M2.toAffine().y.toString()],
                    "k" : k2.toString(),
                    "pk": [public_key.toAffine().x.toString(), public_key.toAffine().y.toString()]
                    };

                const wasm_path_encrypt = "./artifacts/encrypt/encrypt.wasm";
                const zkey_path_encrypt = "./artifacts/encrypt/encrypt.zkey";
                
                // This function is used to avoid block-redeclaration error
                async function getEncryptOutputs(input_encrypt, wasm_path_encrypt, zkey_path_encrypt) {                                                                                                    

                    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_encrypt, wasm_path_encrypt, zkey_path_encrypt);
                    return publicSignals;
                }
                
                const publicSignals_encrypt1 = await getEncryptOutputs(input_encrypt1, wasm_path_encrypt, zkey_path_encrypt);
                const publicSignals_encrypt2 = await getEncryptOutputs(input_encrypt2, wasm_path_encrypt, zkey_path_encrypt);
                
                
                const eM1 = new Point(BigInt(publicSignals_encrypt1[2]), BigInt(publicSignals_encrypt1[3]),1n);   // Take the encrypted message ,1neM1 from the circuit output
                const eM2 = new Point(BigInt(publicSignals_encrypt2[2]), BigInt(publicSignals_encrypt2[3]),1n);   // Take the encrypted message ,1neM2 from the circuit output   
                
                const eM3 = eM1.add(eM2);                                                                         // Add both encrypted messages to verify the homomorphic property
                const M3  = M1.add(M2);                                                                           // Proving M3 = the decrypted eM3 will prove the homomorphic property    
                                                                               
                const ke1 = new Point(BigInt(publicSignals_encrypt1[0]), BigInt(publicSignals_encrypt1[1]),1n);   // Take the ephemeral key ke1 ,1nfrom the circuit output
                const ke2 = new Point(BigInt(publicSignals_encrypt2[0]), BigInt(publicSignals_encrypt2[1]),1n);   // Take the ephemeral key ke2 ,1nfrom the circuit output 
                const ke3 = ke1.add(ke2);                                                                         // The ephemeral key for homomorphic decryption should be the ke1+ke2   
                
                const wasm_path_decrypt = "./artifacts/decrypt/decrypt.wasm";
                const zkey_path_decrypt = "./artifacts/decrypt/decrypt.zkey";

                // The input of the decrypt circuit is given by the added outputs of the encrypt circuit for M1 and M2
                const input_decrypt = {
                    "eM" : [eM3.toAffine().x.toString(), eM3.toAffine().y.toString()],
                    "ke" : [ke3.toAffine().x.toString(), ke3.toAffine().y.toString()],
                    "d"  : private_key.toString()
                };    

                async function getDecryptOutputs(input_decrypt, wasm_path_decrypt, zkey_path_decrypt) { 
                    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);
                    return publicSignals;
                }
                
                const publicSignals_decrypt = await getDecryptOutputs(input_decrypt, wasm_path_decrypt, zkey_path_decrypt);
                
                expect(publicSignals_decrypt[0]).to.equals(M3.toAffine().x.toString());
                expect(publicSignals_decrypt[1]).to.equals(M3.toAffine().y.toString());
            })
        })
});