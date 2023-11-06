const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendDataToMain: (data) => ipcRenderer.send('send-data', data),
    sendResize: (size) => ipcRenderer.send('resize-terminal', size),
    onTerminalData: (func) => {
        ipcRenderer.on('terminal-data', (event, ...args) => func(...args));
    },
    invokeDockerPs: () => {
        ipcRenderer.send('invoke-docker-ps');
    },
    receiveDockerPsData: (callback) => {
        ipcRenderer.on('docker-ps-data', (event, data) => {
            callback(data);
        });
    },
    killSelectedContainers: (containers) => {
        ipcRenderer.send('kill-selected-containers', containers);
    },
    receiveDockerKillData: (callback) => {
        ipcRenderer.on('docker-kill-data', (event, data) => {
            callback(data);
        });
    },
    openLogsTab: (containers) => {
        ipcRenderer.send('open-logs-tab', containers);
    },
    onContainerLogs: (callback) => {
        ipcRenderer.on('containerLogs', (event, containerId, image, logData) => {
            console.log(containerId, image)
            callback(containerId, image, logData);
        });
    },
    stopContainerLog: (containerId) => {
        ipcRenderer.send('stopContainerLog', containerId);
    },
    // Nettoyer l'écouteur pour éviter les fuites de mémoire
    removeContainerLogsListener: () => {
        ipcRenderer.removeAllListeners('containerLogs');
    }
});