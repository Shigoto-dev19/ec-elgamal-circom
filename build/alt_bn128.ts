import { json } from "hardhat/internal/core/params/argumentTypes";

const bigInt = require("big-integer");
let crypto = require("crypto");


// alt_bn128 curve parameters
export const curve = {

  p : bigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583'),
  a : bigInt('00'),
  b : bigInt('03'),
  Gx: bigInt('1'),
  Gy: bigInt('2'),
  n : bigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'),
  h : bigInt('01')
};

export const BI = {

  _0n : bigInt(0),
  _1n : bigInt(1),
  _2n : bigInt(2),
  _3n : bigInt(3),
  _8n : bigInt(8)
}

// big-integer .mod() method can output negative results that's why we use our own
export function mod(num, modular = curve.n) {

  if (num.geq(BI._0n)) return num.mod(modular);
  else return num.mod(modular).add(modular);
};

// Generating random numbers with min included and max excluded
export function getInRange(min ,max) {

  let MIN = bigInt(min);
  let MAX = bigInt(max);
  const range = MAX.subtract(MIN).subtract(1);                            // calculate the range of the interval subtracting _1n to exclude the maximum
  let bi = undefined;

  do {
      const buffer = crypto.randomBytes(Math.ceil(range.bitLength()/8));  // calculate the number of random bytes in the range and accordingly generate as much random bytes
      bi = bigInt((buffer as Buffer).toString('hex'), 16).add(MIN);       // convert the random bytes to bigint and add the min
    } while (bi.compare(MAX) >= 0);                                       // repeat till the number obtained is less than max (the desired range)
  
  return bi.toString();
};

export function getRandomPoint() : Point {
    
  const G = new Point(curve.Gx, curve.Gy);
  const randomConst = getInRange(1, curve.n);
  
  return G.multiplyDA(bigInt(randomConst));
}

export class Point {

  static ZERO = new Point(BI._0n, BI._0n);                               // Point at infinity aka identity point aka _0n
  constructor(public x, public y) {}
  
  // Add point to itself P --> 2P
  double(): Point {

    const X1 = bigInt(this.x);
    const Y1 = bigInt(this.y);
    const m = mod(X1.pow(2).multiply(3).multiply(Y1.multiply(2).modInv(curve.n)));
    const X3 = mod(m.pow(2).subtract(X1.multiply(2)));
    const Y3 = mod(m.multiply(X1.subtract(X3)).subtract(Y1));
    return new Point(X3, Y3);
  };

  // Add two different points : a, b --> a + b
  add(other: Point): Point {

    const [a, b] = [this, other];
    const [X1, Y1, X2, Y2] = [bigInt(a.x), bigInt(a.y), bigInt(b.x), bigInt(b.y)];
    if (X1.isZero() || Y1.isZero()) return b;
    if (X2.isZero() || Y2.isZero()) return a;
    if (X1.eq(X2) && Y1.eq(Y2)) return this.double();
    if (X1.eq(X2) && Y1.eq(mod(Y2.multiply(-1)))) return Point.ZERO;
    const m = mod((Y2.subtract(Y1)).multiply((X2.subtract(X1).modInv(curve.n))));
    const X3 = mod(m.pow(2).subtract(X1).subtract(X2));
    const Y3 = mod(m.multiply(X1.subtract(X3)).subtract(Y1));
    
    return new Point(X3, Y3);
  };

  // Elliptic curve point multiplication with double-and-add algo. n, P --> [n]P
  multiplyDA(n) : Point {
    
    let N = mod(bigInt(n));
    let P = Point.ZERO;
    let d: Point = this;
    if (N.isZero()) return Point.ZERO;
    
    while (N.greater(BI._0n)) {
      if (N.isOdd()) P = P.add(d);
      d = d.double();
      N = N.shiftRight(1);
    }
    return P;
  }

  // Constant time scalar multiplication
  multiplyCT(n) : Point {
    let N = bigInt(n);
    let dbl = new Point(this.x, this.y);
    let P = Point.ZERO;
    let F = Point.ZERO; // fake point
    for (let i = 0; i <= 256; i++) {
      if (N.isOdd()) P = P.add(dbl); else F = F.add(dbl);
      dbl = dbl.double();
      N = N.shiftRight(1);
    }
    return P;
  }

  // Negate
  negate() : Point {

    let X = bigInt(this.x);
    let Y = mod(bigInt(this.y).multiply(-1));
    return new Point(X, Y);
  }  

  // compare if two points are identical
  compare(other: Point) : boolean {
    
    const [a, b] = [this, other];
    const [X1, Y1, X2, Y2] = [bigInt(a.x), bigInt(a.y), bigInt(b.x), bigInt(b.y)];
    return X1.eq(X2) && Y1.eq(Y2)
  }

  // Check if a point P is on the curve E
  check() : boolean {
      
    let X = bigInt(this.x);
      let Y = bigInt(this.y);
      let ls = Y.pow(2).mod(curve.n);
      let rs = X.pow(3).add(curve.b).mod(curve.n);
      let res = ls.subtract(rs).mod(curve.n);
      return res.isZero();
  }
  
  toString() : string {
    
    let X = bigInt(this.x).toString();
    let Y = bigInt(this.y).toString();
    return X + Y;
  }
}


// const rnd = getRandomPoint();
// console.log("EC random point" ,rnd);
// console.log("is a random point on the curve" ,rnd.check());
// let p = new Point(1,2);
// console.log("double result: ", p.double());

// const num = "31042056740251466";
// const num = getInRange(1,curve.n);
// console.log("random number: ", num);

// console.log(" num: ",num);
// const res = p.multiplyDA(num);
// console.log("[num]G : \n x: ",res.x.toString(), "\n y: ",res.y.toString());
// console.log(res.check());



