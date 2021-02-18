const lineReader = require('line-reader');
const path = require('path');
const homedir = require('os').homedir();
const fs = require("fs");

let a = [];
let currSet = {}

async function parse() {

    let file = homedir + '/luca-backup.txt';
    file = path.normalize(file);

    if (!fs.existsSync(file)) {
        return Promise.reject(`Il file di configurazione ${file} non esiste.`);
    }


    return new Promise((resolve, reject) => {
        lineReader.eachLine(file, function (line, last) {

            let type = line.charAt(0);

            line = line.substring(2).trim();
            line = path.normalize(line);

            if (type === 'N') {

                currSet.name = line;

            } else if (type === 'D') {

                currSet.dst = line;
                a.push(currSet);

                // sono alla fine di un task e quindi vogio essere sicuro di 
                // avere sia il nome che le sorgenti
                if (!currSet.name || !currSet.src) {
                    reject();
                    return false;
                }

                currSet = {};

            } else if (type === 'S') {

                if (currSet.src) {
                    currSet.src.push(line);
                } else {
                    currSet.src = [line];
                }
            } else if (type === '#' || type.trim() === '') {
                // commento, lo ignoro
            } else {
                reject();

                // interrompo la lettura
                return false;
            }

            if (last) {
                resolve(a);
            }
        })
    })
}

module.exports = {
    parse
}
