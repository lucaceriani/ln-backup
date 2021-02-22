const Rsync = require('./rsync'); // da npm rsync modificato lo spawn con 'inherit' come stdio
const inquirer = require('inquirer');
const path = require('path');
const readline = require('readline-sync');
const tmpdir = require('os').tmpdir();

const fs = require("fs-extra"); // per copiare tutta la cartella virtuale di nexe

const config = require('./config');

const rsyncDeployFolder = path.join(tmpdir, "/luca-backup");
const rsyncDeployExec = path.join(rsyncDeployFolder, "/rsync.exe");

async function main() {
    let cfg = await config.parse().catch((err) => {
        console.log("Errore nel file di configurazione");
        console.log(err);
    });

    // se non sono a posto ritono (esco con attesa)
    if (!cfg) return;

    // copio rsync al suo posto
    try {
        deployRsync();
    } catch (err) {
        console.error(err);
        console.log("Errore nella copia di rsync");
        return;
    }

    console.log("File di configurazione letto correttamente!");

    let taskToDo = await inquirer
        .prompt([
            {
                type: 'list',
                name: 'theme',
                message: 'Quale backup vuoi eseguire?',
                choices: [
                    'Tutti',
                    new inquirer.Separator(),
                    ...cfg.map((task, idx) => ({ name: task.name, value: idx }))
                ],
            }
        ])

    taskN = taskToDo.theme; // per estrarlo dall'oggeto di inquirer

    if (taskN === "Tutti") {
        for (let task of cfg) {
            await doRsync(task);
        }
    } else {
        await doRsync(cfg[taskN]);
    }
}

async function doRsync(task) {
    for (let source of task.src) {


        // console.log("Copio da " + source);
        // console.log("       a " + task.dst);

        source = source.replace(/([a-z]):/i, "/cygdrive/$1/");
        let destination = task.dst.replace(/([a-z]):/i, "/cygdrive/$1/");

        source = path.normalize(source);
        destination = path.normalize(destination);

        console.log("Copio da " + source);
        console.log("       a " + destination);

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
    console.log("rsync pronto!");
}


(async function () {
    console.log("Luca Backup - v 1.1.0");
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
