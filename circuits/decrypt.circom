pragma circom 2.1.2;

include "negatePoint.circom";
include "multiplyPoint.circom";


template Decrypt () {

    signal input eM[2];                 // sender's encrypted message
    signal input ke[2];                 // sender's ephemeral key
    signal input d;                     // receiver's private key

    signal output dM[2];                // decrypted message
    
    component multiply = MultiplyPoint(254);
    multiply.c <== d;
    multiply.p <== ke;

    component addNeg = AddNegate();
    addNeg.p1 <== eM;
    addNeg.p2 <== multiply.out;

    dM <== addNeg.out;
}

//component main { public [ eM ] } = Decrypt();