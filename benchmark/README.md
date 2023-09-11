### Break Baby Jubjub ECDL => 25 iterations

| Decode  | Ops/Sec | Avg Time/Op | Min Time | Max Time |
|-----------------|---------|-------------|----------|----------|
| precomputed19   | 1       | 782ms ±18.04%| 129ms    | 1988ms   |
| precomputed18   | 0       | 1059ms ±26.57%| 123ms    | 2862ms   |
| precomputed17   | 0       | 2922ms ±21.33%| 123ms    | 5609ms   |
| precomputed16   | 0       | 5819ms ±19.81%| 352ms    | 11s      |



### Baby Jubjub EC Multiplication => 1000 iterations

| Library      | Ops/Sec  | Avg Time/Op | Min Time | Max Time |
|--------------|----------|--------------|----------|----------|
| circomlibjs  | 106      | 9ms          | -        | -        |
| noble        | 6,206    | 161μs ±32.14%| 119μs    | 26ms     |

### Baby Jubjub EC Addition => 10_000 iterations
| Library      | Ops/Sec  | Avg Time/Op | Min Time | Max Time |
|--------------|----------|--------------|----------|----------|
| circomlibjs  | 3,116    | 320μs        | -        | -        |
| noble        | 3,165    | 315μs        | -        | -        |
