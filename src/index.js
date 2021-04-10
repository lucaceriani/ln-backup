const Rsync = require("./rsync"); // da npm rsync modificato lo spawn con "inherit" come stdio
const inquirer = require("inquirer");
const path = require("path");
const tmpdir = require("os").tmpdir();
const listDisks = require("./my-drivelist");
const { version } = require("../package.json");
const fs = require("fs-extra"); // per copiare tutta la cartella virtuale di nexe
const moment = require("moment");
const po = require("./pretty-output");
const parseConfig = require("./config");
const commandLineArgs = require("command-line-args")

const optionDefinitions = [
    { name: "backup", alias: "b", type: String },
    { name: "disco", alias: "d", type: String, },
    { name: "prova", alias: "p", type: Boolean, },
]

/////////////////////////////////////////////////////////////////////


const rsyncDeployFolder = path.join(tmpdir, "/ln-backup");
const rsyncDeployExec = path.join(rsyncDeployFolder, "/rsync.exe");
let options;

async function menu() {

    try {
        options = commandLineArgs(optionDefinitions)
    } catch (e) {
        throw ("Errore nei parametri\nOpzione sconoscuta: " + e.optionName)
    }

    let cfg = parseConfig();

    // se non sono a posto ritono (esco con attesa)
    if (!cfg) {
        throw "Errore nel file di configurazione!";
    }

    // copio rsync al suo posto
    try {
        deployRsync();
    } catch (err) {
        console.error(err);
        throw "Errore nella copia di rsync nella cartella: " + rsyncDeployFolder;
    }


    let taskIdx;

    if (options.backup) {
        taskIdx = cfg.findIndex(task => task.name.toLowerCase() == options.backup.toLowerCase())
        if (taskIdx == -1) throw `Impossible trovare il task "${options.backup}"`;

        po.suc(`Task "${cfg[taskIdx].name}" trovato!`);

    } else {

        let tasksInquirerChoices = cfg.map((task, idx) => ({
            name: `${task.name}\n${task.src.map(s => "    - " + s).join("\n")}`,
            value: idx
        }));

        let inq = await inquirer
            .prompt({
                type: "list",
                name: "taskN",
                loop: false,
                pageSize: 50,
                message: "Quale backup vuoi eseguire?",
                choices: [
                    "Tutti",
                    new inquirer.Separator(),
                    ...tasksInquirerChoices
                ],
            });

        taskIdx = inq.taskN;
    }

    if (taskIdx === "Tutti")
        for (let task of cfg) await doRsync(task);
    else
        await doRsync(cfg[taskIdx]);

}

async function doRsync(task) {

    let destination = task.dst;
    let winDestination = task.dst;

    // controllo disco variabile (con ? al posto del nome del disco)
    if (destination.startsWith("?")) {

        // se non comincia con ?ALL allora è usb only
        let usbOnly = !destination.startsWith("?ALL")

        if (options.disco) {
            // aggiungo i duepunti se non ci sono
            if (!options.disco.includes(":")) options.disco += ":"
            selectedDisk = options.disco
        } else {
            selectedDisk = await askForDrive(usbOnly);
        }

        // skippo il task se non trovo nessun disco valido
        if (!selectedDisk) return;


        // lo sostituisco nella destinazione
        destination = destination.replace(/\?(ALL)?:/, selectedDisk);

        // mi salvo la destinazione come path di windows di windows
        winDestination = destination;

        // a questo punto ho la destinazione definitiva come path di windows
        // creo le cartelle che mancano per non dare errore a rsync
        if (!fs.existsSync(winDestination)) {
            fs.mkdirSync(winDestination, {
                recursive: true
            });
        }
    }

    po.log("");
    po.log("Copio da " + task.src.join(", "));
    po.log("       a " + destination);
    po.log("");
    po.log("Il backup sta per iniziare... (premi CTRL+C per annullare)");

    await new Promise(resolve => setTimeout(resolve, 4000));

    // uso i cygdrive
    let source = task.src.map(s => s.replace(/^([a-z]):/i, "/cygdrive/$1"));
    destination = destination.replace(/^([a-z]):/i, "/cygdrive/$1");

    // source = path.normalize(source);
    // destination = path.normalize(destination);

    // console.log("Copio da " + source);
    // console.log("       a " + destination);

    let rs = new Rsync()
        .executable(rsyncDeployExec)
        .flags("rlth")
        .set("info", "progress2")
        .source(source)
        .destination(destination)
        ;

    // se ho delle esclusioni le faccio adesso
    if (task.excl) rs.exclude(task.excl);

    // se ho passato il parametro prova non eseguo niente
    // mostro solo il comando
    if (options.prova) return console.log(rs.command());


    let rsyncPid;

    const quitting = () => {
        if (rsyncPid) rsyncPid.kill();
        process.exit();
    }
    process.on("SIGINT", quitting); // run signal handler on CTRL-C
    process.on("SIGTERM", quitting); // run signal handler on SIGTERM
    process.on("exit", quitting); // run signal handler when main process exits

    await new Promise(resolve => {
        rsyncPid = rs.execute((error, code, cmd) => {
            if (error) po.red("Errore rsync n: " + code);
            else {
                po.suc(`Backup "${task.name}" completato!`);

                // uso windestination pechè mi server il path di windows con di cygdrive
                // non posso usare task.dst perchè potrebbere avere un ? / ?ALL
                writeDateFile(winDestination, task);
            }
            resolve();
        })
    });
}

async function askForDrive(usbOnly) {
    // prendo lettera e size degli HDD che hanno un mountpoint
    let disks = listDisks().filter(disk => usbOnly ? disk.isUSB : true);


    // se non riesco ad ottenere la lista skippo questo task
    if (disks == null) throw "Impossibile ottenere la lista dei dischi";

    if (disks.length == 0) {
        console.log(`Nessun disco${usbOnly ? " USB" : ""} trovato.`);
        return null;
    }

    // allora richiesta del disco
    let { selectedDisk } = await inquirer
        .prompt([
            {
                type: "list",
                name: "selectedDisk",
                message: `Qual è il disco${usbOnly ? " USB" : ""} di destinaione?`,
                choices: disks.map(d => ({
                    name: `${d.letterColon} (${d.size}${d.name ? (" - " + d.name) : ""})`,
                    value: d.letterColon
                }))
            }
        ])

    return selectedDisk;
}

function deployRsync() { // can throw
    fs.copySync(path.join(__dirname, "/rsync"), rsyncDeployFolder);
    // console.log("rsync pronto!");
}

function writeDateFile(destinazione, task) {
    let dataOra = moment().format("DD/MM/YYYY [alle] HH:mm");
    fs.writeFileSync(
        path.join(destinazione, "LN Backup.txt"),
        `LN Backup v ${version}\n\n[ ${task.name} ]\nUltimo backup eseguito correttamente il ${dataOra}`
    )
}


async function main() {
    po.cls();
    po.tit("LN Backup - v " + version);
    po.bri(`
     __   _  __   ___           __           
    / /  / |/ /  / _ )___ _____/ /____ _____ 
   / /__/    /  / _  / _ \`/ __/  "_/ // / _ \\
  /____/_/|_/  /____/\\_,_/\\__/_/\\_\\\\_,_/ .__/   v ${version}
                                      /_/    
    `)

    try {
        await menu();
    } catch (err) {
        po.err(err);
        po.err("Errore imprevisto!");
        po.key("\nPremere INVIO per uscire... ");
        return;
    }

    po.key("\nPremere INVIO per tornare al menu principale...")
    main();
}

// inizia
main();

