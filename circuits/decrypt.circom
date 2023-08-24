pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/escalarmul.circom";
include "negatePoint.circom";

// TODO: check if isOnCurve is need -> examine from circomlib
template Decrypt() {

    signal input eM[2];                 // sender's encrypted message
    signal input ke[2];                 // sender's ephemeral key
    signal input d;                     // receiver's public key

    signal output dM[2];                // decrypted message => [d]ke - eM
    
    component isOnCurve[2];

    isOnCurve[0] = BabyCheck();                 // check the encrypted message is point on curve
    isOnCurve[0].x <== eM[0];
    isOnCurve[0].y <== eM[1];
    
    isOnCurve[1] = BabyCheck();                 // check the ephemeral key is a point on Curve
    isOnCurve[1].x <== ke[0];
    isOnCurve[1].y <== ke[1];
    
    // baby jubjub curve generator
    var base[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    component n2b = Num2Bits(253);
    component escalarMul = EscalarMul(253, base);

    escalarMul.inp[0] <== ke[0];
    escalarMul.inp[1] <== ke[1];

    var i;

    d ==> n2b.in;

    for  (i=0; i<253; i++) {
        n2b.out[i] ==> escalarMul.in[i];
    }

    // component multiply = MultiplyPoint(254);
    // multiply.c <== d;
    // multiply.p <== ke;

    component addNeg = AddNegate();
    addNeg.p1 <== eM;
    addNeg.p2 <== escalarMul.out;

    dM <== addNeg.out;
}

//component main { public [ eM ] } = Decrypt();