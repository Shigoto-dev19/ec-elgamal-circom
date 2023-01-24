pragma circom 2.1.2;

include "../node_modules/circomlib/circuits/comparators.circom";

template OnCurve () {
    
    signal input p[2];
    signal output out;
    
    signal left <== p[1] * p[1];
    signal int <== p[0] * p[0];
    signal right <== int * p[0] + 3;

    component ise = IsEqual();
    ise.in[0] <== left;
    ise.in[1] <== right;

    out <== ise.out;
}

//component main = OnCurve();

/* INPUT = {
    "p": [
             "7642510734996977133390601470142397019554247327537627672584099553437813517733",
             "6150091010770190884973744377351019322596952687708702299791645913015551009380"
           ]
    
} */