const Rsync = require('./rsync'); // da npm rsync modificato lo spawn con 'inherit' come stdio
const inquirer = require('inquirer');
const path = require('path');
const readline = require('readline-sync');
const tmpdir = require('os').tmpdir();
const listDisks = require("./my-drivelist");
const { version } = require("../package.json");
const fs = require("fs-extra"); // per copiare tutta la cartella virtuale di nexe

const po = require("./pretty-output");
const parseConfig = require('./config');
const { join } = require('path');


/////////////////////////////////////////////////////////////////////


const rsyncDeployFolder = path.join(tmpdir, "/ln-backup");
const rsyncDeployExec = path.join(rsyncDeployFolder, "/rsync.exe");

async function main() {

    let cfg = parseConfig();

    // se non sono a posto ritono (esco con attesa)
    if (!cfg) {
        po.err("Errore nel file di configurazione!");
        return;
    }

    // copio rsync al suo posto
    try {
        deployRsync();
    } catch (err) {
        console.error(err);
        console.log("Errore nella copia di rsync nella cartella: " + rsyncDeployFolder);
        return;
    }

    let tasksInquirerChoices = cfg.map((task, idx) => ({
        name: `${task.name}\n${task.src.map(s => "    - " + s).join("\n")}`,
        value: idx
    }));

    let { taskN } = await inquirer
        .prompt({
            type: 'list',
            name: 'taskN',
            message: 'Quale backup vuoi eseguire?',
            choices: [
                'Tutti',
                new inquirer.Separator(),
                ...tasksInquirerChoices
            ],
        });

    if (taskN === "Tutti")
        for (let task of cfg) await doRsync(task);
    else
        await doRsync(cfg[taskN]);

}

async function doRsync(task) {

    let destination = task.dst;

    // controllo disco variabile (con ? al posto del nome del disco)
    if (destination.startsWith("?")) {

        // se non comincia con ?ALL allora è usb only
        let usbOnly = !destination.startsWith("?ALL")

        // prendo lettera e size degli HDD che hanno un mountpoint
        let listOfDisks = listDisks(usbOnly);

        // se non riesco ad ottenere la lista skippo questo task
        if (listOfDisks == null) return;

        if (listOfDisks.length == 0) {
            console.log(`Nessun disco${usbOnly ? " USB" : ""} trovato.`);
            return;
        }

        let disks = listOfDisks.sort((a, b) => a.letterColon.localeCompare(b.letterColon))

        // allora richiesta del disco
        let { selectedDisk } = await inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'selectedDisk',
                    message: `Qual è il disco${usbOnly ? " USB" : ""} di destinaione?`,
                    choices: disks.map(d => ({
                        name: `${d.letterColon} (${d.size}${d.name ? (" - " + d.name) : ""})`,
                        value: d.letterColon
                    }))
                }
            ])

        // lo sostituisco nella destinazione
        destination = destination.replace(/\?(ALL)?:/, selectedDisk);

    }

    // per ogni sorgente


    console.log("Copio da " + task.src.join(", "));
    console.log("       a " + destination);

    console.log("Il backup sta per iniziare... (premi CTRL+C per annullare)");

    await new Promise(resolve => setTimeout(resolve, 4000));

    // uso i cygdrive
    let sources = task.src.map(s => s.replace(/([a-z]):/i, "/cygdrive/$1"));
    destination = destination.replace(/([a-z]):/i, "/cygdrive/$1");

    // source = path.normalize(source);
    // destination = path.normalize(destination);

    // console.log("Copio da " + source);
    // console.log("       a " + destination);

    let rs = new Rsync()
        .executable(rsyncDeployExec)
        .flags('rlth')
        .set('info', 'progress2')
        .source(sources)
        .destination(destination);

    // se ho delle esclusioni le faccio adesso
    if (task.excl) rs.exclude(task.excl);

    // return console.log(rs.command());

    let rsyncPid;

    const quitting = () => {
        if (rsyncPid) rsyncPid.kill();
        process.exit();
    }
    process.on("SIGINT", quitting); // run signal handler on CTRL-C
    process.on("SIGTERM", quitting); // run signal handler on SIGTERM
    process.on("exit", quitting); // run signal handler when main process exits

    await new Promise(resolve => {
        rsyncPid = rs.execute(
            function (error, code, cmd) {
                if (error) po.red("Errore rsync n: " + code);
                else po.suc(`Backup "${task.name}" completato!`);

                rsyncPid = null;
                resolve();
            })
    });
}

function deployRsync() { // can throw
    fs.copySync(path.join(__dirname, "/rsync"), rsyncDeployFolder);
    // console.log("rsync pronto!");
}


(async function () {
    po.tit("LN Backup - v " + version);
    po.bri(`
     __   _  __   ___           __           
    / /  / |/ /  / _ )___ _____/ /____ _____ 
   / /__/    /  / _  / _ \`/ __/  '_/ // / _ \\
  /____/_/|_/  /____/\\_,_/\\__/_/\\_\\\\_,_/ .__/   v ${version}
                                      /_/    
    `)

    try {
        await main();
    } catch (err) {
        console.log(err);
        console.log("Errore imprevisto!");
    }
    readline.question("\nPremere INVIO per uscire... ", { hideEchoBack: true, mask: '' });
}
)();
