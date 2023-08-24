pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/babyjub.circom";

template Negate() {
    
    signal input p[2];
    signal output out[2];

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

// component main = AddNegate();

/* INPUT = {

    "p1": ["10614836967206073115878571854411621055830680546950380174399474835952985998040",
           "19865291015589380477843586142835973985345448807857804777447947442362310430937"],
    "p2": ["10614836967206073115878571854411621055830680546950380174399474835952985998040",
           "19865291015589380477843586142835973985345448807857804777447947442362310430937"]
} */