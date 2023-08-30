import { getRandomPoint, getInRange } from "../src";

const snarkjs = require("snarkjs");
const fs = require("fs");
const expect = require("chai").expect;
const buildBabyjub = require("circomlibjs").buildBabyjub;

const IDENTITY_POINT = ["0", "1"];
let wasm_path = "./circuits/artifacts/negatePoint_test/negatePoint.wasm";
let zkey_path = "./circuits/artifacts/negatePoint_test/negatePoint.zkey";

describe("Negate Point Circuit Tests", () => {
    let babyJub;
    let Fr;

    before(async () => {
        babyJub = await buildBabyjub();
        Fr = babyJub.F;
    });

    it("Verify negatePoint circuit", async () => {
        const input = {
            p: [
                "3826393960720816662831938603723895862750202421541904555926837642392617390322",
                "12963355305038832970669440384928558628649722712755972889462080629196143923803",
            ],
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasm_path,
            zkey_path,
        );
        const vKey = JSON.parse(
            fs.readFileSync("./circuits/artifacts/negatePoint_test/negatePoint.vkey.json"),
        );

        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        expect(res).to.equal(true);
    });

    it("Verify adding a point to its negate returns the IDENTITY point", async () => {
        const input = {
            p: [
                "3826393960720816662831938603723895862750202421541904555926837642392617390322",
                "12963355305038832970669440384928558628649722712755972889462080629196143923803",
            ],
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasm_path,
            zkey_path,
        );
        expect(publicSignals).to.deep.equals(IDENTITY_POINT);
    });

    // skipped because of circuit error log
    it.skip("Verify negating an invalid point is invalid", async () => {
        const input = { p: [5, 10] };
        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                wasm_path,
                zkey_path,
            );
        } catch (error) {
            expect(error.message).to.include("Error in template Negate_2 line: 13");
        }
    });

    it("Verify negating the IDENTITY point returns the IDENTITY point", async () => {
        const input = { p: ["0", "1"] };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasm_path,
            zkey_path,
        );
        expect(publicSignals).to.deep.equals(IDENTITY_POINT);
    });

    it("Verify negating a random point returns the IDENTITY point", async () => {
        const point = await getRandomPoint();
        const input = { p: [...point.map((x) => Fr.toObject(x))] };
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasm_path,
            zkey_path,
        );

        expect(publicSignals).to.deep.equals(IDENTITY_POINT);
    });

    it("Verify looped random point negation returns always identity", async () => {
        for (let i = 0; i < 10; i++) {
            const point = await getRandomPoint();
            const input = { p: [...point.map((x) => Fr.toObject(x))] };
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                wasm_path,
                zkey_path,
            );

            expect(publicSignals).to.deep.equals(IDENTITY_POINT);
        }
    });
});
