pragma circom 2.1.2;

include "addPoint.circom";

template Negate() {
    
    signal input p[2];
    signal output out[2];

    out[0] <== p[0];
    out[1] <== - p[1];
}

template AddNegate() {

    signal input p1[2];
    signal input p2[2];
    signal output out[2];

    component add = AddPoint();
    component negate = Negate();

    negate.p <== p2;

    add.p1 <== p1;
    add.p2 <== negate.out;

    out <== add.out;
}

template TestNegate() {

    signal input p[2];
    signal output out[2];

    component add = AddDiffPoint();
    component negate = Negate();

    negate.p <== p;
    add.p1 <== p;
    add.p2 <== negate.out;

    out <== add.out;   
}

//component main = AddNegate();

/* INPUT = {

    "p1": ["10614836967206073115878571854411621055830680546950380174399474835952985998040",
           "19865291015589380477843586142835973985345448807857804777447947442362310430937"],
    "p2": ["10614836967206073115878571854411621055830680546950380174399474835952985998040",
           "19865291015589380477843586142835973985345448807857804777447947442362310430937"]
} */