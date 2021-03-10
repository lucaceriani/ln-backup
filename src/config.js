const path = require('path');
const homedir = require('os').homedir();
const fs = require("fs-extra");



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

    const rawFile = fs.readFileSync(configFile);

    // controllo il file
    if (!rawFile) {
        console.log("Errore nella lettura del file di configurazione!");
        return null;
    }

    // splitto e trimmo
    const lines = rawFile
        .toString() // è un buffer
        .split(/\r?\n/) // splitto per righe
        .map(l => l.trim()) // trimmo

    let tasks = [];
    let currTask = {}

    // per ogni riga
    for ([lineN, line] of lines.entries()) {

        // in base 1
        lineN++;

        // la lettera del comando
        const type = line.charAt(0);

        // la linea senza i primi due caratteri (lettera comando + spazio)
        line = line.substring(2).trim();

        if (type === "N") {

            // se ho già un nome è un errore
            if (currTask.name) {
                console.log(`Linea ${lineN}: Nome gia' presente per il task: ${line}`);
                return null;
            }

            currTask.name = line;

        } else if (type === "D") {

            // sono alla fine di un task e quindi voglio esere
            // sicuro di avere sia il nome che le sorgenti
            if (!currTask.name || !currTask.src) {

                if (!currTask.name) {
                    console.log(`Linea ${lineN}: Nessun nome per la destinazione: ${line}`);
                    return null;
                } else if (!currTask.src) {
                    console.log(`Linea ${lineN}: Nessuna sorgente per la destinazione: ${line}`);
                    return null;
                }
            }

            line = path.normalize(line);

            currTask.dst = line;

            // sono alla fine di un task quindi lo aggiungo
            tasks.push(currTask);

            // mi preparo per un altro task
            currTask = {};

        } else if (type === "S") {

            // sono ad un tipo sorgente vuol dire che devo avere il nome
            if (!currTask.name) {
                console.log(`Linea ${lineN}: Nessun nome per la destinazione: ${line}`);
                return null;
            }

            line = path.normalize(line);
            // pusho oppure assegno
            currTask.src = [...(currTask.src || []), line]

        } else if (type === "#" || line.trim() === "") {
            // commento, lo ignoro
            // oppure riga vuota
        } else {

            // si è verificato un errore
            console.log(`Linea ${lineN}: Comando non riconosciuto: ${type} ${line}`);
            return null;
        }


    } // end for sulle linee

    return tasks;
}

module.exports = parseConfig;
