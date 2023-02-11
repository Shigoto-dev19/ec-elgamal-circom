import { getRandomPoint, getInRange } from "../elgamal";
import { bn254 } from '../noble_bn254';
const assert = require('chai').assert; 

const Point = bn254.ProjectivePoint; 
const G = Point.BASE;
const fp = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; 


describe("Testing noble ECC Operations TS \n", () => {


    context("Point Addition", () => {

        it("check adding a random point to IDENTITY returns the same point", () => {
            
            const P = getRandomPoint();
            const ZERO = Point.ZERO;
            const add1 = P.add(ZERO);
            const add2 = ZERO.add(P);
            assert( add1.equals(P) && add2.equals(P), "error : identity addition is expected!");

        });

        it("check adding a random point to itself returns its double", () => {

            const P = getRandomPoint();
            const add = P.add(P);
            const dbl = P.double();
            assert( add.equals(dbl), "error: double expected!");
        });

        it("check adding a point to its NEGATE returns IDENTITY", () => {

            const P = getRandomPoint();
            const Q = P.negate();
            const add = P.add(Q);
            const ZERO = Point.ZERO;
            assert( add.equals(ZERO), "error: negate addition expects IDENTITY!")
        
        });

        it("check adding two random points on the curve returns a point on the curve", () => {
            
            const P1 = getRandomPoint();
            const P2 = getRandomPoint();
            const add = P1.add(P2);
            assert( add.assertValidity() === undefined, "error: addition returns a point not on curve!");
            
        });

        it("looped adding two random points on the curve returns a point on the curve", () => {
            
            for(let i=0; i<100; i++) {
                
                let P1 = getRandomPoint();
                let P2 = getRandomPoint();
                let add = P1.add(P2);
                assert( add.assertValidity() === undefined, "error: looped addition returns a point not on curve!");
            };
        });

        it("check adding a point to itself n times retruns [n]P", () => {

            const n = getInRange(1n, 100000n);
            const P = getRandomPoint();
            let sum = Point.ZERO;
            for (let i=0; i<n; i++) sum = sum.add(P);
            const mult = P.multiply(n);
            assert(sum.equals(mult), "result not expected!");

        });

    });    


    context("Scalar Multiplication", () => {

        it("multiplying a random point with ZERO returns Error using noble EC", () => {

            const P = getRandomPoint();
            const ZERO = Point.ZERO;
            let expected = Error;
            const exercise = () => P.multiply(0n).equals(ZERO);
            assert.throws(exercise, expected);
        });

        it("multiplying the base with random coefficient returns a random point on curve", () => {

            const rnd = getInRange(1n, fp);
            let P = G.multiply(rnd);
            assert( P.assertValidity() === undefined, "The point is not on the curve!");
        });

        it("point with random coordinates shouldn't be on curve", () => {
            
            const P = new Point(BigInt(getInRange(1n, fp)), BigInt(getInRange(1n, fp)),1n);
            let expected = Error;
            const exercise = () => P.assertValidity();
            assert.throws(exercise, expected);
        });

        it("multiplying a random point by 2 returns it double", () => {

            const P = getRandomPoint();
            let d1 = P.multiplyUnsafe(2n);
            let d2 = P.multiply(2n);
            let d3 = P.double();
            assert(d1.equals(d2) && d1.equals(d3), "The double methods returned different results!");
            
        });

        it("looped random point scalar multiplication returns compliant results", () => {

            for (let i=0; i<100; i++) {

                let rnd = getInRange(1n,fp);
                let P = G.multiplyUnsafe(rnd);
                let Q = G.multiply(rnd);
                assert( P.equals(Q) && P.assertValidity() === undefined, 'Point not on curve !')
            }

        });
    });
})

