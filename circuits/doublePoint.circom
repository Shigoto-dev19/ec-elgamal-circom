pragma circom 2.1.2;

template DoublePoint () {

    signal input p[2];
    signal m;
    signal output out[2];
    
    signal m1;
    signal m2;
    
    m1 <== 3 * p[0] * p[0]; 
    m2 <== 2 * p[1];
    m <-- m1 / m2;
    m * m2 === m1;

    signal y1;

    out[0] <== m*m - 2*p[0];
    y1 <== p[0] - out[0];
    out[1] <== m*y1 - p[1];
        
}

//component main  = DoublePoint ();

/* INPUT = {
    "p": [5,10]
} */
