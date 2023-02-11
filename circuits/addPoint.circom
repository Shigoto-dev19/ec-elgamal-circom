pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";
include "doublePoint.circom";


template AddDiffPoint () {

    signal input p1[2];
    signal input p2[2];
    signal m;
    signal output out[2];

    component ise[2];
    
    for (var i=0; i<2; i++) ise[i] = IsEqual();
    ise[0].in[0] <== p1[0];
    ise[0].in[1] <== p2[0];

    ise[1].in[0] <== p1[1];
    ise[1].in[1] <== - p2[1];

    signal c <== ise[0].out * ise[1].out;   // check if the two points are symmetric

    signal m1;
    signal m2;

    signal x1;
    signal y1;
    signal c1 <== 1 - c;

    signal int <== p1[1] - p2[1];
    m1 <==  int * c1;                       // assert error should be fixed
    m2 <== (p1[0] - p2[0]);                 // m2 should be zero if the points are symmetric
    m <-- m1 / m2;
    m * m2 === m1;

    x1 <== m*m - p1[0];
    signal int1 <== x1 - p2[0];
    out[0] <== int1 * c1;
    
    y1 <== out[0] - p1[0];
    signal int2 <== -p1[1] - m*y1;
    out[1] <== int2 * c1;
          
}


template AddPoint() {
    
    signal input p1[2];
    signal input p2[2];
    signal output out[2];
    
    component isz[4];
    for (var i=0; i<4; i++) isz[i] = IsZero();
    
    isz[0].in <== p1[0];
    isz[1].in <== p1[1];
    signal c1 <== isz[0].out * isz[1].out; // check if the first point is the IDENTITY point
    //log("c1: ",c1);

    isz[2].in <== p2[0];
    isz[3].in <== p2[1];
    signal c2 <== isz[2].out * isz[3].out; // check if the second point is the IDENTITY point
    //log("c2: ",c2);


    component ise[2];
    for (var i=0; i<2; i++) ise[i] = IsEqual();
    
    ise[0].in[0] <== p1[0];
    ise[0].in[1] <== p2[0];

    ise[1].in[0] <== p1[1];
    ise[1].in[1] <== p2[1];
    signal c3 <== ise[0].out * ise[1].out; // check if the two points are the same
    //log("c3: ",c3);

    component doublePoint = DoublePoint();
    doublePoint.p <== p1;
    signal db[2] <== doublePoint.out;      

    component addDiff = AddDiffPoint();     
    addDiff.p1 <== p1;
    addDiff.p2 <== p2;
    signal difp[2] <== addDiff.out;


    component multiAND = MultiAND(3); 
    multiAND.in[0] <== 1 + c1 -2*c1; // NOT(c1)
    multiAND.in[1] <== 1 + c2 -2*c2; // NOT(c2)
    multiAND.in[2] <== 1 + c3 -2*c3; // NOT(c3)

    signal c4 <== multiAND.out;
    //log("c4: ",c4);

    signal s1[2];
    signal s2[2];
    signal s3[2];
    
    for (var i=0; i<2; i++){
        s1[i] <== c1 * p2[i];
        s2[i] <== s1[i] + c2 * p1[i];
        s3[i] <== s2[i] + c3 * db[i];
        out[i] <== s3[i] + c4 * difp[i]; 
    }
        
}


//component main = AddPoint();