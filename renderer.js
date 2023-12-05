// Configure the terminal
const terminal = new Terminal();
const fitAddon = new FitAddon.FitAddon();

const dockerPsButton = document.getElementById('dockerPsButton');
const dockerPsOutput = document.getElementById('dockerPsOutput');
const dockerKillButton = document.getElementById('dockerKillButton');
const selectAllButton = document.getElementById('selectAllButton');
const dockerLogsButton = document.getElementById('dockerLogsButton');
const dockerLogsOutput = document.getElementById('Tab2');

let selectedContainers = {};

// Fonction pour générer les cases à cocher
function createCheckboxes(data) {
    dockerPsOutput.innerHTML = ''; // Clear the previous output
    const lines = data.split('\n');
    lines.forEach((line) => {
        if (line.startsWith('CONTAINER')) {
            const header = document.createElement('div');
            header.textContent = line;
            dockerPsOutput.appendChild(header);
        } else
        if (line.trim()) {
            const parts = line.split(new RegExp(/\s{2,}/));

            parts.forEach((part, id) => {
                if (part.length === 0) {
                    // Remove the empty part
                    parts.splice(id, 1);
                }
            });
            const id = parts[0]; // Assuming the first part is the container ID

            const containerDiv = document.createElement('div');
            containerDiv.className = 'checkbox-container-div';
            containerDiv.id = `checkbox-container-div-${id}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = id;
            checkbox.value = id;

            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) {
                    selectedContainers[id] = parts[1];
                } else {
                    delete selectedContainers[id];
                }
                console.log(selectedContainers);
            });

            containerDiv.addEventListener('click', (event) => {
                console.log("event")
                checkbox.checked = !checkbox.checked;

                // Déclenchez manuellement l'événement de changement sur la case à cocher
                const changeEvent = new Event('change');
                checkbox.dispatchEvent(changeEvent);
            })


            const label = document.createElement('p');
            label.htmlFor = id;
            label.className = 'container-label';


            parts.forEach((part, id) => {
                const span = document.createElement('span');
                span.classList.add('container-label-part');
                span.classList.add(`container-label-part-${id}`);
                span.textContent = part;
                label.appendChild(span);
            });


            containerDiv.appendChild(checkbox);
            containerDiv.appendChild(label);

            dockerPsOutput.appendChild(containerDiv);
        }
    });
}

function createLogTab(containerId, image) {
    const tab = document.createElement('button');
    tab.className = 'tablinks-logs';
    tab.id = `logTab-${containerId}`;
    tab.textContent = image;
    tab.addEventListener('click', () => {
        const logTabs = document.querySelectorAll('.tablinks-logs');
        logTabs.forEach((logTab) => {
            logTab.className = logTab.className.replace(' active', '');
        });
        tab.className += ' active';

        const logContents = document.querySelectorAll('.tabcontent-logs');
        logContents.forEach((logContent) => {
            logContent.style.display = 'none';
        });

        document.querySelector(`.tabcontent-logs-${containerId}`).style.display = 'block';

        const closeButton = document.getElementById('close-button');
        closeButton.style.display = 'block';

    });

    const logsContainer = document.getElementById('logsContainer');


    const logContent = document.createElement('pre');
    logContent.className = `tabcontent-logs-${containerId} tabcontent-logs`;
    logContent.style.display = 'none';

    logsContainer.appendChild(logContent);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.id = 'close-button';
    closeButton.addEventListener('click', () => {
        logContent.remove();
        tab.remove();
        window.electron.stopContainerLog(containerId);
    });

    tab.appendChild(closeButton);

    return tab;
}


// ------------------------------------
// ------------------------------------
// ---------- LISTENERS ---------------
// ------------------------------------
// ------------------------------------

// Setup the event listener for receiving Docker PS data
window.electron.receiveDockerPsData((data) => {
    createCheckboxes(data);
});

window.electron.receiveDockerKillData((data) => {
    selectedContainers = {};
    window.electron.invokeDockerPs();
})

// Recevoir les logs et les afficher dans un sous-onglet
window.electron.onContainerLogs((containerId, image, logData) => {
    // Trouver ou créer un sous-onglet pour le conteneur
    let logTab = document.getElementById(`logTab-${containerId}`);
    if (!logTab) {
        logTab = createLogTab(containerId, image); // Fonction pour créer un sous-onglet
        document.getElementById('logsTabContainer').appendChild(logTab);
    }
    const lines = logData.split('\n');
    lines.forEach((line) => {
        const logLine = document.createElement('div');
        if (line.includes('Error:') || line.includes('ERROR')) {
            logLine.className = 'red';
        } else if (line.includes('Warning:') || line.includes('WARN')) {
            logLine.className = 'yellow';
        } else if (line.includes('Info:') || line.includes('INFO')) {
            logLine.className = 'green';
        } else if (line.includes('Debug:') || line.includes('DEBUG')) {
            logLine.className = 'blue';
        } else if (line.includes('[33m') || line.includes('[33;1m') || line.includes('[38;5;3m') || line.includes('[34;1m') || line.includes('[39m') || line.includes('[39;1m') || line.includes('[32m')) {
            line = line.replaceAll('[33m', '')
                .replaceAll('[33;1m', '')
                .replaceAll('[38;5;3m', '')
                .replaceAll('[34;1m', '')
                .replaceAll('[39m', '')
                .replaceAll('[39;1m', '')
                .replaceAll('[32m', '');
            logLine.className = 'green';
        }
        logLine.textContent = line;
        document.querySelector(`.tabcontent-logs-${containerId}`).appendChild(logLine);
    })
});

dockerPsButton.addEventListener('click', () => {
    window.electron.invokeDockerPs();
});

dockerKillButton.addEventListener('click', () => {
    window.electron.killSelectedContainers(selectedContainers);
})

selectAllButton.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#dockerPsOutput input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
        selectedContainers[checkbox.id] = checkbox.value;
    });
});

dockerLogsButton.addEventListener('click', () => {
    if (Object.keys(selectedContainers).length > 0) {
        window.electron.openLogsTab(selectedContainers);
    }
});

// ------------------------------------
// ------------------------------------

terminal.open(document.getElementById('terminal'));
terminal.loadAddon(fitAddon);
fitAddon.fit();

// Écoutez les données entrantes de l'utilisateur dans le terminal
terminal.onData(data => {
    window.electron.sendDataToMain(data);
});

// Écoutez les données en provenance du processus principal pour les afficher dans le terminal
window.electron.onTerminalData((data) => {
    terminal.write(data);
});

// Adjust terminal dimensions when window is resized
window.addEventListener('resize', () => {
    fitAddon.fit();
    // Envoyez les nouvelles dimensions au processus principal
    window.electron.sendResize({ cols: terminal.cols, rows: terminal.rows });
});