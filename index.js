const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const pty = require('node-pty');
const { exec } = require('child_process');
const os = require('os');
//const child_process = require('child_process');

let dockerPath = '';
if (os.platform() === 'win32') {
    dockerPath = 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe';
} else if (os.platform() === 'darwin') {
    dockerPath = '/Applications/Docker.app/Contents/Resources/bin/docker';
} else if (os.platform() === 'linux') {
    dockerPath = '/usr/bin/docker';
}

// Ajouter le chemin vers Docker au PATH actuel
process.env.PATH = `${process.env.PATH}${path.delimiter}${dockerPath}`;

// Créez une variable globale pour maintenir une référence à la fenêtre principale
let mainWindow;
let logProcesses = {};


const shell = pty.spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: 70,
        rows: 10,
        cwd: process.env.HOME,
        env: process.env
    }
);

function createWindow() {
    mainWindow = new BrowserWindow({
        // Configuration de la fenêtre...
        webPreferences: {
            contextIsolation: true, // important pour la sécurité et l'utilisation de contextBridge
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // désactivé pour la sécurité
            sandbox: true // activé pour la sécurité
        },
        width: 800,
        height: 600,
    });

    mainWindow.loadFile('index.html');

    // Fermez la référence sur la fenêtre lorsqu'elle est fermée
    mainWindow.on('closed', function() {
        mainWindow = null;
        process.exit();
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('send-data', (event, data) => {
    shell.write(data);
});

ipcMain.on('resize-terminal', (event, size) => {
    shell.resize(size.cols, size.rows);
});

// Sécurisez la communication du shell vers le processus de rendu
shell.on('data', (data) => {
    if (mainWindow) { // Vérifiez si la fenêtre principale existe encore
        mainWindow.webContents.send('terminal-data', data);
    }
});


ipcMain.on('invoke-docker-ps', (event) => {
    console.log("invoke -- docker ps");
    exec(`${dockerPath} ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exécution de la commande Docker échouée : ${error}`);
            return;
        }
        event.reply('docker-ps-data', stdout);
    });
});

ipcMain.on('kill-selected-containers', (event, containers) => {
    exec(`${dockerPath} kill ${containers.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exécution de la commande Docker échouée : ${error}`);
            return;
        }
        exec(`${dockerPath} rm ${containers.join(' ')}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exécution de la commande Docker échouée : ${error}`);
                return;
            }
        })
        event.reply('docker-kill-data', stdout);
    });

});

ipcMain.on('open-logs-tab', (event, containers) => {
    Object.keys(containers).forEach((id) => {
        const logProcess = pty.spawn(`${dockerPath}`, ['logs', '-f', id], { name: 'xterm-color' });

        logProcess.on('data', (data) => {
            event.sender.send('containerLogs', id, containers[id], data);
        });
    });
});

ipcMain.on('stopContainerLog', (event, containerId) => {
    if (logProcesses[containerId]) {
        logProcesses[containerId].kill(); // Arrête le suivi des logs
        delete logProcesses[containerId]; // Supprime la référence au processus
    }
});