pragma circom 2.1.2;

include "negatePoint.circom";
include "multiplyPoint.circom";
include "onCurve.circom";

template Decrypt () {

    signal input eM[2];                 // sender's encrypted message
    signal input ke[2];                 // sender's ephemeral key
    signal input d;                     // receiver's public key

    signal output dM[2];                // decrypted message
    
    component onc[2];

    onc[0] = OnCurve();                 // check the encrypted message is point on curve
    onc[0].p <== eM;
    onc[0].out === 1;
    
    onc[1] = OnCurve();                 // check the ephemeral key is a point on Curve
    onc[1].p <== ke;
    onc[1].out === 1;
    
    component multiply = MultiplyPoint(254);
    multiply.c <== d;
    multiply.p <== ke;

    component addNeg = AddNegate();
    addNeg.p1 <== eM;
    addNeg.p2 <== multiply.out;

    dM <== addNeg.out;
}

//component main { public [ eM ] } = Decrypt();