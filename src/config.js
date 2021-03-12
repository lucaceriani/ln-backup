const path = require('path');
const homedir = require('os').homedir();
const fs = require("fs-extra");
const nearley = require("nearley");
const grammar = require("./config-grammar");

const po = require("./pretty-output");

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
        po.err(`Il file di configurazione ${configFile} non esiste.`);
        return null;
    }

    const rawFile = fs.readFileSync(configFile).toString();

    // controllo il file
    if (!rawFile) {
        po.err("Errore nella lettura del file di configurazione!");
        return null;
    }

    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));


    let parsed;

    try {
        parser.feed(rawFile);
        parsed = parser.results[0];
    } catch (err) {
        po.err("Errore nella sintassi del file di configurazione:");
        po.log(err
            .toString()
            .split(/\r?\n/)
            .filter(l => l.match(/(^ *\d+)|( +\^)/))
            .join("\n")
        );

        return null;
    }

    return parsed;
}

module.exports = parseConfig;
