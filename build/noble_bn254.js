"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bn254 = void 0;
const modular_1 = require("./abstract/modular");
const weierstrass_1 = require("./abstract/weierstrass");
const hmac_1 = require("@noble/hashes/hmac");
const sha256_1 = require("@noble/hashes/sha256");
const utils_1 = require("@noble/hashes/utils");
exports.bn254 = (0, weierstrass_1.weierstrass)({
    a: 0n,
    b: 3n,
    Fp: (0, modular_1.Fp)(21888242871839275222246405745257275088548364400416034343698204186575808495617n),
    n: 21888242871839275222246405745257275088548364400416034343698204186575808495617n,
    Gx: 1n,
    Gy: 2n,
    hash: sha256_1.sha256,
    hmac: (key, ...msgs) => (0, hmac_1.hmac)(sha256_1.sha256, key, (0, utils_1.concatBytes)(...msgs)),
    randomBytes: utils_1.randomBytes,
    h: 1n
});
