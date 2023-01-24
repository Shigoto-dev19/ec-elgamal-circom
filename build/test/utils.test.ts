import  { Point, curve, getInRange, getRandomPoint } from "../alt_bn128";
const assert = require('chai').assert; 


const G = new Point(curve.Gx, curve.Gy);

describe("Testing ECC Operations TS \n", () => {


    context("Point Addition", () => {

        it("check adding a random point to IDENTITY returns the same point", () => {
            
            const P = getRandomPoint();
            const ZERO = Point.ZERO;
            const add1 = P.add(ZERO);
            const add2 = ZERO.add(P);
            assert( add1.compare(P) && add2.compare(P), "error : identity addition is expected!");

        });

        it("check adding a random point to itself returns its double", () => {

            const P = getRandomPoint();
            const add = P.add(P);
            const dbl = P.double();
            assert( add.compare(dbl), "error: double expected!");
        });

        it("check adding a point to its NEGATE returns IDENTITY", () => {

            const P = getRandomPoint();
            const Q = P.negate();
            const add = P.add(Q);
            const ZERO = Point.ZERO;
            assert( add.compare(ZERO), "error: negate addition expects IDENTITY!")
        
        });

        it("check adding two random points on the curve returns a point on the curve", () => {
            
            const P1 = getRandomPoint();
            const P2 = getRandomPoint();
            const add = P1.add(P2);
            assert( add.check(), "error: addition returns a point not on curve!");
            
        });

        it("looped adding two random points on the curve returns a point on the curve", () => {
            
            for(let i=0; i<100; i++) {
                
                let P1 = getRandomPoint();
                let P2 = getRandomPoint();
                let add = P1.add(P2);
                assert( add.check(), "error: looped addition returns a point not on curve!");
            };
        });

        it("check adding a point to itself n times retruns [n]P", () => {

            const n = getInRange(1, 100000);
            const P = getRandomPoint();
            let sum = Point.ZERO;
            for (let i=0; i<n; i++) sum = sum.add(P);
            const mult = P.multiplyDA(n);
            assert(sum.compare(mult), "result not expected!");

        });

    });    


    context("Scalar Multiplication", () => {

        it("multiplying a random point with ZERO returns IDENTITY", () => {

            const P = getRandomPoint();
            const ZERO = Point.ZERO;
            const mult = P.multiplyDA(0);
            assert(mult.compare(ZERO), "point of IDENTITY expected!");
        });

        it("multiplying the base with random coefficient returns a random point on curve", () => {

            const rnd = getInRange(1, curve.n);
            let P = G.multiplyDA(rnd);
            assert( P.check(), "The point is not on the curve!");
        });

        it("point with random coordinates shouldn't be on curve", () => {
            
            const P = new Point(getInRange(1, curve.p), getInRange(1, curve.p));
            assert( P.check() == false, 'A point with random coordinates is found located on the curve!')
        });

        it("multiplying a random point by 2 returns it double", () => {

            const P = getRandomPoint();
            let d1 = P.multiplyDA(2);
            let d2 = P.multiplyCT(2);
            let d3 = P.double();
            assert(d1.compare(d2) && d1.compare(d3), "The double methods returned different results!");
            
        });

        it("looped random point scalar multiplication returns compliant results", () => {

            for (let i=0; i<100; i++) {

                let rnd = getInRange(1,curve.n);
                let P = G.multiplyDA(rnd);
                let Q = G.multiplyCT(rnd);
                assert( P.compare(Q) && P.check(), 'Point not on curve !')
            }

        });
    });
})

