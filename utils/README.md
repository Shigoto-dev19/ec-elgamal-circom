# Description

## Elliptic Curve Operations

It is notable that the library [noble-curves]("https://github.com/paulmillr/noble-curves") is the fastest and most secure package that offers the best performance to do elliptic cuve operations. 
I did code something similar myself by trying the simple textbook short weierstrass form but "noble-curves" is at least five times faster to what I coded and that is because they used projective point form to save computation from the intensive inverse modulo operation that is fundamental to calculate the coefficient m in the short weierstrass form. 
For many other interesting optimizations, see the details in this interesting blog [Learning fast elliptic-curve cryptography]("https://paulmillr.com/posts/noble-secp256k1-fast-ecc/").

## Encoding and Decoding

In general, the input needed for the protocol is chosen to be 64 bits, but a number of this size is still too big for practical use if it needs to be decoded.
The encoding algorithm used for the ElGamal Scheme is simply multiplying a scalar $x$ to the base point of the curve $G$ and hence we understand that the decoding algorithm must be breaking the EC discrete log of this encoded point which is not an easy task.

Decoding by breaking the discrete log, means retaining all the awesome Finite Field properties when dealing with elliptic curve point. That means addition, scalar multiplication remain valid even after decoding.

Directly decoding a point that is known to be multiplied to a 64-bit is not efficient even having modern hardware, the simple solution to this problem is to split this number to two 32-bit numbers $xlo$ and $xhi$ such that $input = xlo + 2^{32} xhi$. 

Knowing that ElGamal Scheme is additively homorphic it is easy to merge two 32-bit encrypted inputs the same applied with xlo and xhi.

In fact a 32-bit number is not that big, but mapping elliptic curve operations in a loop of this size is a quite intense process. That's why caching (storing) some computations will save a lot of efforts regarding that retrieving the data is a O(1) constant-time process, meaning that it is almost instantaneous and it doesn't depend on the size of data.
Still, storing large files is not desirable if the code will be deployed in a web-browser.

It is evident that storing a lookuptable as binary file is the most compact and fast method to store data.
Storing the the data in hexadecimal in a .json is two times the size of the same data in a .bin file regarding the every two charchters are stored in one buffer as a byte.

Here are some commonly used data structures and their time complexity for lookups:

*Arrays: $O(n)$, where $n$ is the number of elements in the array.
*Objects (used as hashtables): $O(1)$ on average, but $O(n)$ in the worst case if the keys are not properly hashed.
*Map: $O(1)$ on average, due to the use of a hash table internally.
*Binary search trees: $O(log n)$, where $n$ is the number of elements in the tree.

While coding, I tried many data structures and many methods to find an optimal solution for this time-space dilemma, it is really true that retrieving data from objects stored in json files is the fastest way to do that using "hasOwnProperty" method. Other than that, the binary file is similar to an array, it true that it is compact but it is compelling to iterate through data to find the right value for decoding which cannot be faster than a constant time process.

If the precomputations are saved as binary, then converting them to an object again will nullify any speed benefit that was aimed to achieve a constant time computation.

Considering that less data is faster found in general, I tried to compress the data as much as I could to the point that I saved as the keys as base35 numbers, it became quite compact but the rest of the computation when mapping to find the key becomes so intense that make the whole process slow again.

It is possible to make faster computations by parallelizing the computation process, but considering size, speed, and worker creation time makes the number of the decision variables even larger.