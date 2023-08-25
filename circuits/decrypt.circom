pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/babyjub.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "negatePoint.circom";

// TODO: check if isOnCurve is need -> examine from circomlib
template Decrypt() {

    // sender's encrypted message
    signal input encryptedMessage[2];   
    // sender's ephemeral key              
    signal input ephemeralKey[2];  
    // receiver's private key               
    signal input privateKey;                     

    // decrypted message => [privateKey].ephemralKey - decryptedMessage
    signal output decryptedMessage[2];                
    
    component isOnCurve[2];
    // assert the encrypted message is a point on curve
    isOnCurve[0] = BabyCheck();         
    isOnCurve[0].x <== encryptedMessage[0];
    isOnCurve[0].y <== encryptedMessage[1];
    // assert the ephemeral key is a point on curve
    isOnCurve[1] = BabyCheck();         
    isOnCurve[1].x <== ephemeralKey[0];
    isOnCurve[1].y <== ephemeralKey[1];
    
    component n2b = Num2Bits(253);
    component escalarMul = EscalarMulAny(253);

    escalarMul.p[0] <== ephemeralKey[0];
    escalarMul.p[1] <== ephemeralKey[1];

    var i;
    privateKey ==> n2b.in;
    for  (i=0; i<253; i++) {
        n2b.out[i] ==> escalarMul.e[i];
    }

    component addNeg = AddNegate();
    addNeg.p1 <== encryptedMessage;
    addNeg.p2 <== escalarMul.out;

    decryptedMessage <== addNeg.out;
}

