const { execSync } = require('child_process');
const prettyBytes = require('pretty-bytes');

function getCommandOutput(command) {
    let a = execSync("wmic logicaldisk get deviceid,drivetype,size,volumename").toString();
    // console.log(a);
    return a;
};

function listDisks(usbOnly = false) {

    let commandOutput = getCommandOutput();

    /*
    Esempio di output

    DeviceID  DriveType  Size          VolumeName
    C:        3          510882312192
    D:        3          240054734848  Archivio
    E:        2          8008970240    CCCOMA_X64FRE_IT-IT_DV9

    */

    let drives;

    try {

        drives = commandOutput
            .split("\r\n") // splitto per CRLF
            .slice(1) // cancello la prima riga
            .map(l => l.trim()) // trimmo
            .filter(l => l != "") // tolgo le righe vuote

            .map(l => l.replace(/ +/g, " ")) // gli spazi multipli diventano singoli
            .map(l => l.split(" ")) // separo sugli spazi
            .filter(la => la[0].match(/^[A-Z]:$/)) // la lettera deve essere giusta
            .filter(la => la.length >= 3) // deve avere almeno 3 elementi (lettera, tipo e size)
            .map(la => ({
                letterColon: la[0],
                isUSB: la[1] == "2",
                size: prettyBytes(parseInt(la[2]), { maximumFractionDigits: 0 }),
                name: la[3] ? la[3] : null
            }))
            // controllo se ho USB only
            .filter(d => usbOnly ? d.isUSB : true);

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

