const { execSync } = require('child_process');
const prettyBytes = require('pretty-bytes');

function getCommandOutput() {
    let a = execSync("wmic logicaldisk get deviceid,volumedirty,size,volumename").toString();
    // console.log(a);
    return a;
};

function listDisks() {

    let commandOutput = getCommandOutput();

    /*
    Esempio di output

    [0]       [1]           [2]          [3]

    DeviceID  Size          VolumeDirty  VolumeName  
    C:        510882312192
    D:        240054734848               Archivio
    E:        7854325760    FALSE        LUCA - 8GB

    */

    let drives;

    try {

        // prendo le larghezze colonna dalla prima riga
        const cl = commandOutput
            .split(/\r?\n/)[0]
            .match(/[^ ]+ */g)
            .map(s => s.length)

        drives = commandOutput
            .split(/\r?\n/) // splitto per CR?LF
            .map(line => line.trim())
            .filter(line => line != "")
            .slice(1) // cancello la prima riga
            .map(line => [
                line.slice(0, cl[0]).trim(),
                line.slice(cl[0], cl[1] + cl[0]).trim(),
                line.slice(cl[0] + cl[1], cl[2] + cl[1] + cl[0]).trim(),
                line.slice(cl[2] + cl[1] + cl[0], cl[3] + cl[2] + cl[1] + cl[0]).trim()
            ])
            .map(la => ({
                letterColon: la[0],
                size: prettyBytes(parseInt(la[1]), { maximumFractionDigits: 0 }),
                isUSB: !!la[2].match(/TRUE|FALSE/),
                name: la[3]
            }))
            .sort((a, b) => a.letterColon.localeCompare(b.letterColon))
            ;


        // console.log(drives);


    } catch (e) {
        console.error(e);
        console.log("Errore nella parsificazione di wmic:");
        console.log(commandOutput);
        return null;
    }

    // console.log(drives);

    return drives;
}


module.exports = listDisks;

