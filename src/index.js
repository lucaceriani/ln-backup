const Rsync = require('./rsync'); // da npm rsync modificato lo spawn con 'inherit' come stdio
const inquirer = require('inquirer');
const path = require('path');
const readline = require('readline-sync');
const tmpdir = require('os').tmpdir();
const drivelist = require('drivelist');
const jp = require("jsonpath");
const prettyBytes = require('pretty-bytes');

const fs = require("fs-extra"); // per copiare tutta la cartella virtuale di nexe

const config = require('./config');

const rsyncDeployFolder = path.join(tmpdir, "/ln-backup");
const rsyncDeployExec = path.join(rsyncDeployFolder, "/rsync.exe");

async function main() {


    let cfg = await config.parse().catch((err) => {
        console.log("Errore nel file di configurazione");
        console.log(err);
    });

    // se non sono a posto ritono (esco con attesa)
    if (!cfg) return;

    // console.log("File di configurazione letto correttamente!");

    // copio rsync al suo posto
    try {
        deployRsync();
    } catch (err) {
        console.error(err);
        console.log("Errore nella copia di rsync nella cartella: " + rsyncDeployFolder);
        return;
    }

    let taskToDo = await inquirer
        .prompt([
            {
                type: 'list',
                name: 'task',
                message: 'Quale backup vuoi eseguire?',
                choices: [
                    'Tutti',
                    new inquirer.Separator(),
                    ...cfg.map((task, idx) => ({ name: task.name, value: idx }))
                ],
            }
        ])

    taskN = taskToDo.task; // per estrarlo dall'oggetto di inquirer

    if (taskN === "Tutti") {
        for (let task of cfg) {
            await doRsync(task);
        }
    } else {
        await doRsync(cfg[taskN]);
    }
}

async function doRsync(task) {

    let destination = task.dst;

    // controllo disco variabile (con ? al posto del nome del disco)
    if (destination.startsWith("?")) {

        let usbOnly = true;

        if (destination.startsWith("?ALL")) usbOnly = false;

        // prendo lettera e size degli HDD che hanno un mountpoint
        let rawDisks = await drivelist.list();

        let disks = rawDisks
            // filtro quelli che hanno un mountpoint
            .filter(d => d.mountpoints.length > 0 && (usbOnly ? d.isUSB == true : true))
            .map(d => ({
                // attenzione! tolgo il backslash finale!
                letter: d.mountpoints[0].path.replace("\\", ""),
                size: prettyBytes(d.size, { maximumFractionDigits: 0 }),
                description: d.description
            }))
            .sort((a, b) => a.letter.localeCompare(b.letter))

        // console.log(disks);

        // allora richiesta del disco
        let selectedDisk = await inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'disk',
                    message: `Qual è il disco${usbOnly ? " USB" : ""} di destinaione?`,
                    choices: disks.map(d => ({
                        name: `${d.letter} (${d.size} - ${d.description})`,
                        value: d.letter
                    }))
                }
            ])

        // lo estraggo da inquirer
        selectedDisk = selectedDisk.disk;
        console.log(selectedDisk);

    }


    return; // TODO DELETE


    // per ogni sorgente
    for (let source of task.src) {


        console.log("Copio da " + source);
        console.log("       a " + task.dst);

        source = source.replace(/([a-z]):/i, "/cygdrive/$1/");
        destination = destination.replace(/([a-z]):/i, "/cygdrive/$1/");

        source = path.normalize(source);
        destination = path.normalize(destination);

        // console.log("Copio da " + source);
        // console.log("       a " + destination);

        let rs = new Rsync()
            .executable(rsyncDeployExec)
            .flags('rlth')
            .set('info', 'progress2')
            .source(source)
            .destination(destination);

        let rsyncPid;

        var quitting = function () {
            if (rsyncPid) {
                rsyncPid.kill();
            }
            process.exit();
        }
        process.on("SIGINT", quitting); // run signal handler on CTRL-C
        process.on("SIGTERM", quitting); // run signal handler on SIGTERM
        process.on("exit", quitting); // run signal handler when main process exits

        await new Promise((resolve, reject) => {
            rsyncPid = rs.execute(
                function (error, code, cmd) {
                    if (error) {
                        console.log("Errore rsync n: " + code);
                        resolve();
                    } else {
                        console.log("OK");
                        resolve();
                    }

                    rsyncPid = null;
                })
        });

    }
}

function deployRsync() { // can throw
    fs.copySync(path.join(__dirname, "/rsync"), rsyncDeployFolder);
    // console.log("rsync pronto!");
}


(async function () {
    console.log("Luca Node Backup - v 1.2.0");
    console.log("---------------------");
    console.log("");
    try {
        await main();
    } catch (err) {
        console.log(err);
        console.log("Errore imprevisto!");
    }
    readline.question("\nPremi INVIO per uscire\n");
}
)();
