pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/babyjub.circom";

template Negate() {
    
    signal input p[2];
    signal output out[2];

    // check that the point is a point on curve
    component isOnCurve = BabyCheck();
    isOnCurve.x <== p[0];
    isOnCurve.y <== p[1];

    out[0] <== - p[0];
    out[1] <== p[1];
}

template AddNegate() {

    signal input p1[2];
    signal input p2[2];
    signal output out[2];

    component add = BabyAdd();
    component negate = Negate();

    negate.p <== p2;

    add.x1 <== p1[0];
    add.y1 <== p1[1];
    add.x2 <== negate.out[0];
    add.y2 <== negate.out[1];

    out[0] <== add.xout;
    out[1] <== add.yout;
}

template TestNegate() {

    signal input p[2];
    signal output out[2];

    component add = BabyAdd();
    component negate = Negate();

    negate.p <== p;
    add.x1 <== p[0];
    add.y1 <== p[1];
    add.x2 <== negate.out[0];
    add.y2 <== negate.out[1];

    out[0] <== add.xout;
    out[1] <== add.yout;  
}
