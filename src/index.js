const Rsync = require('rsync');
const inquirer = require('inquirer');
const homedir = require('os').homedir();
const path = require('path');
const readline = require('readline-sync');
const tmpdir = require('os').tmpdir();

const config = require('./config');

async function main() {
    let cfg = await config.parse().catch((err) => { console.log(err); });

    if (!cfg) {
        console.log("Errore nel file di configurazione");
        return;
    }

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

    // console.log(taskN);

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
            .executable(tmpdir + "/luca-backup/rsync.exe")
            // .progress()
            // .flags('a')
            .flags('rlth')
            .set('info', 'progress2')
            .source(source)
            .destination(destination)
            .output((data) => console.log(data.toString()))
            ;


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


(async function () {
    console.log("Luca Backup - v 1.0.0");
    console.log("---------------------");
    console.log("");
    try {
        await main();
    } catch (err) {
        console.log(err);
        console.log("Errore imprevisto!");
    }
    readline.question("\nPremi INVIO per uscire ");
}
)();
