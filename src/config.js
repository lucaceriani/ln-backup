const lineReader = require('line-reader');
const path = require('path');
const homedir = require('os').homedir();
const fs = require("fs-extra");

let tasks = [];
let currTask = {}
let currLineN = 0;

async function parse() {

    let file = path.join(homedir, '/ln-backup.txt');
    file = path.normalize(file);

    if (!fs.existsSync(file)) {
        return Promise.reject(`Il file di configurazione ${file} non esiste.`);
    }


    return new Promise((resolve, reject) => {
        lineReader.eachLine(file, function (rawLine, last) {

            // aumento il contatore delle righe
            currLineN++;

            let type = rawLine.charAt(0);

            let line = rawLine.substring(2).trim();
            line = path.normalize(line);

            if (type === 'N') {

                currTask.name = line;

            } else if (type === 'D') {

                // sono alla fine di un task e quindi voglio esere
                // sicuro di avere sia il nome che le sorgenti
                if (!currTask.name || !currTask.src) {

                    if (!currTask.name)
                        reject(`Linea ${currLineN}: Nessun nome per la destinazione: ${line}`);
                    if (!currTask.src)
                        reject(`Linea ${currLineN}: Nessuna sorgente per la destinazione: ${line}`);

                    return false;
                }

                currTask.dst = line;
                tasks.push(currTask);
                currTask = {};

            } else if (type === 'S') {

                if (currTask.src) {
                    currTask.src.push(line);
                } else {
                    currTask.src = [line];
                }
            } else if (type === '#' || rawLine.trim() === '') {
                // commento, lo ignoro
                // oppure riga vuota
            } else {

                // si è verificato un errore
                reject(`Linea ${currLineN}: Comando non riconosciuto: ${rawLine}`);
                return false;
            }

            if (last) {
                resolve(tasks);
            }
        })
    })
}

module.exports = {
    parse
}
