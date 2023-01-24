pragma circom 2.1.2;

include "addPoint.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// n is the bits number of the coefficient: it can be 254 or the specific bit length of the coefficient

template MultiplyPoint(n) {
    
    signal input c;                         // c is the coefficient
    signal input p[2];
    signal output out[2];

    signal d[n][2];                         // this will store the double points depending on the 0 bits
    d[0] <== [0,0]; 

    component doublePoint[n-1];

    doublePoint[0] = DoublePoint();
    doublePoint[0].p <== p;
    d[1] <== doublePoint[0].out;

    for (var i=2; i<n; i++) {
        doublePoint[i-1] = DoublePoint();
        doublePoint[i-1].p <== d[i-1];
        d[i] <== doublePoint[i-1].out;
    }
 
    component bitify = Num2Bits_strict();   // The number of operation depends on the binary bits of the coefficient
    signal bits[n];

    bitify.in <== c;
    bits <== bitify.out;

    signal int[n][2];
    int[0][0] <== bits[0] * p[0];
    int[0][1] <== bits[0] * p[1];

    component addPoint[n-1];
    signal x[n-1];
    signal y[n-1];

    for (var i=1; i < n; i++) {

        addPoint[i-1] = AddPoint();
        addPoint[i-1].p1 <== int[i-1];
        addPoint[i-1].p2 <== d[i];

        x[i-1] <== bits[i] * (addPoint[i-1].out[0]);
        int[i][0] <== x[i-1] + (1 - bits[i]) * (int[i-1][0]);
        
        y[i-1] <== bits[i] * (addPoint[i-1].out[1]);
        int[i][1] <== y[i-1] + (1 - bits[i]) * (int[i-1][1]);
     
    }

    out <== int[n-1];
}

