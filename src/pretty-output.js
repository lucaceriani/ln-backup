const ck = require("chalk");
const readline = require('readline-sync');

const cl = console.log;

module.exports = {
    err: s => cl(ck.bold.red(s)),
    inv: s => cl(ck.inverse(s)),
    bri: s => cl(ck.yellow(s)),
    suc: s => cl(ck.bold.green(s)),
    log: s => cl(s),
    tit: s => process.title = s,
    key: s => readline.question(s, { hideEchoBack: true, mask: '' }),
    cls: () => console.clear(),
}
