import * as bench from 'micro-bmark';
import { genRandomSalt, genRandomPoint } from '../src';
import { babyJub as CURVE} from "../utils/babyjub-noble";
import { toBigIntArray } from '../utils/tools';


const buildBabyjub = require("circomlibjs").buildBabyjub;
const babyJub = CURVE.ExtendedPoint;

function circomlib_baby_mul(babyjub: any, F: any) {
    const randomScalar = genRandomSalt();
    const idenPoint = babyjub.mulPointEscalar(babyjub.Base8, randomScalar);
    return idenPoint.map((x) => F.toString(x))
}

function noble_baby_mul() {
    const randomScalar = genRandomSalt();
    const noblePoint = babyJub.BASE.multiply(randomScalar).toAffine();
    return noblePoint
}

function circomlib_baby_add(babyjub: any, F: any) {
    const point1 = genRandomPoint();
    const point2 = genRandomPoint();
    const point1_e = toBigIntArray(point1).map(x => F.e(x));
    const point2_e = toBigIntArray(point2).map(x => F.e(x));
    const added = babyjub.addPoint(point1_e, point2_e).map(x => F.toString(x));

    return added
}

function noble_baby_add() {
    const point1 = genRandomPoint();
    const point2 = genRandomPoint();
    const added = point1.add(point2).toAffine()

    return added
}

const { compare, run } = bench;
run(async () => {
    const babyjub = await buildBabyjub();
    const F = babyjub.F;
    
    await compare('BabyJub EC Multiplication', 1000, {
      circomlibjs: () => circomlib_baby_mul(babyjub, F),
      noble: () => noble_baby_mul(),
    });

    await compare('BabyJub EC Addition', 10_000, {
        circomlibjs: () => circomlib_baby_add(babyjub, F),
        noble: () => noble_baby_add(),
    });
    bench.utils.logMem(); // Log current RAM
});