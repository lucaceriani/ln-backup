const path = require('path');
const homedir = require('os').homedir();
const fs = require("fs-extra");

const nearley = require("nearley");
const grammar = require("./config-grammar");

/*
    il formato JSON finale:
    tasks = [
        {
            name: ...
            src: [..., ...}
            dst: ...
        },
        ...
    ]
*/

function parseConfig() {

    const configFile = path.join(homedir, 'ln-backup.txt');

    if (!fs.existsSync(configFile)) {
        console.log(`Il file di configurazione ${configFile} non esiste.`);
        return null;
    }

    const rawFile = fs.readFileSync(configFile).toString();

    // controllo il file
    if (!rawFile) {
        console.log("Errore nella lettura del file di configurazione!");
        return null;
    }

    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    parser.feed(rawFile);

    return parser.results[0];
}

module.exports = parseConfig;
