const ck = require("chalk");

const cl = console.log;

module.exports = {
    err: s => cl(ck.bold.red(s)),
    inv: s => cl(ck.inverse(s)),
    bri: s => cl(ck.yellow(s)),
    log: s => cl(s),
    tit: s => process.title = s,
}
