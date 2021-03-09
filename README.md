# ![LT Backup](logo.png)

LN Backup è un software per il **backup incrementale** scritto in Javascript (Node.js),
come wrapper a **rsync**, portato su Windows come [cwRsync](https://itefix.net/cwrsync).
LN Backup è distribuito come unico file eseguibile grazie a [nexe](https://www.npmjs.com/package/nexe).

### ✔ Scarica il file eseguibile qui: [download](https://github.com/lucaceriani/ln-backup/releases/latest/download/LN-Backup.exe)


## Istruzioni

### File di configurazione

Il programma per funzionare necessita, prima di essere avviato, di avere un file di configurazione pronto.

Il file di configurazione deve chiamarsi `ln-backup.txt` e **deve trovarsi nella cartella dell'utente**, su Windows anche chiamata *cartella personale*. Di solito la sua posizione è 
`C:\Users\<nome utente>` (es. `C:\Users\Luca`) 

Un possibile persorso per il file di
configurazione potrebbe essere quindi `C:\Users\Luca\ln-backup.txt`.


### Nome, sorgente, destinazione
Quando si vuole effettaure un backup è necessario conoscere due cose:
- la cartella di origine, dove si trovano i file di cui voglio fare il backup
- la cartella di destinazione, la posizione in cui voglio conservare i file 

Per far sapere al software queste informazione è necessario scrivere un file di configurazione corretto e, in aggiunta, è necessario assegnare un nome a ogni **azione di backup**.

Ogni **azione di backup**, di seguito chiamata **task**, deve quindi avere nell'ordine:
  - un nome
  - una o più sorgenti
  - una destinazione
  
Queste tre proprietà del task sono indicate con delle lettere maiuscole seguite
da uno spazio seguite dal percoso della cartella,
rispettivamente `N` per il nome, `S` per la/le sorgente/i, `D` per la destinazione. 

#### Esempio di file di configurazione `ln-backup.txt`
```
N Backup foto
S C:\Users\Luca\Desktop\Foto
D E:\Backup-foto

N Backup documenti
S D:\Dati\Archivio
S D:\Lavoro\Documenti
D E:\Backup-documenti
```
Questa configurazione definisce due task:
  - uno con il nome **Backup foto** che ha come sorgente la cartella `C:\Users\Luca\Desktop\Foto` e destinazione `E:\backup-foto`
  - un altro con il nome **Backup documenti** che ha due sorgenti e destinazione `E:\Backup-documenti`

È anche possibile **commentare** il proprio file di configurazione usando `#` all'inizio della riga di commento.

### Copio la cartella o il contentuo?
Si prenda ad esempio questo task di backup:
```
N Backup delle foto (copio la cartella)
S C:\Users\Luca\Foto
D E:\Backup
```
Scritta in questo modo la cartella `Foto` della sorgente verrà copiata dentro la cartella `E:\Backup`, il percorso completo è quindi `E:\Backup\Foto`.

Per **copiare solo il contenuto** della cartella `Foto` e non la cartella stessa in `E:\Backup` basta **aggiungere un `\`** in fondo al percorso della sorgente il file di configurazione diventa quindi:
```
N Backup delle foto (copio il contenuto)
S C:\Users\Luca\Foto\
D E:\Backup
```

### Sorgenti multiple

⚠ **ATTENZIONE**: nel caso di sorgenti multiple è necessario che le cartelle finali siano diverse. Il software copia la cartella finale di ogni sorgente
dentro la cartella di destinazione. Assegnando come sorgente `C:\a` e come destinazione `D:\b` il backup della cartella `a` sarà effettuato in `D:\b\a`.

È chiaro quindi che assegnando come sorgenti `C:\foto` e `C:\documenti\foto`, e come destinazione `D:\backup` i contenuti delle due cartelle andrebbero a finire in 
`D:\backup\foto` mescolandosi.

### Hard disk esterni e lettere variabili
Il backup spesso è effettuato su hard disk esterni, e, dato che nel file di configurazione è necessario indicare la lettera
questo potrebbe generare dei problemi, in quanto Windows non fornisce nessuna garanzia sull'assegnazione delle lettera per uno specifico hard disk.

Per questo motivo si è introdotta una sintassi particolare che permette, al momento del lancio del backup, di scegliere su quale disco utilizzare.

Si utilizza il punto interrogativo al posto del disco per indicare che questo potrebbe variare:
#### Esempio con disco con lettera variabile
```
N Backup foto
S C:\Users\Luca\Desktop\Foto
D ?:\Backup-foto
```
In questo modo verranno mostrati all'utente tutti i **dischi USB** collegati al computer.

Se per qualche ragione si volessero mostrare **tutti i dischi** (non solo quelli USB) basta aggiungere `ALL` dopo il punto intettogativo.
#### Esempio con disco con lettera variabile (mostra tutti i dischi)
```
N Backup foto
S C:\Users\Luca\Desktop\Foto
D ?ALL:\Backup-foto
```

---


###### LN sta per Luca Node
