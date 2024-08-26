const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs-extra');
const xlsx = require('xlsx');

let mainWindow;
let fileWatcher;
let audioFiles = {};
let teamNames = {};
let currentSetup = {
    numTeams: 0,
    numEntries: 0,
    filePath: '',
    teamInfoInput: false,
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadFile('screens/setup.html');
    attachIpcHandlers();
}

function attachIpcHandlers() {
    ipcMain.on('navigate', async (event, page) => handleNavigation(page));
    ipcMain.on('focus-fix', () => fixWindowFocus());
    ipcMain.handle('get-documents-path', () => app.getPath('documents'));
    ipcMain.handle('set-global-data', (event, key, value) => setGlobalData(key, value));
    ipcMain.handle('get-global-data', (event, key) => {
        return currentSetup[key];
    });
    ipcMain.on('get-global-data-sync', (event, key) => {
        event.returnValue = currentSetup[key];
    });
}


async function handleNavigation(page) {
    await mainWindow.loadFile(page);

    if (page === 'screens/main.html') {
        const { numTeams, numEntries, filePath } = currentSetup;
        const { scores, winningTeam } = readExcel(numTeams, numEntries, filePath);
        mainWindow.webContents.send('excel-data', { scores, winningTeam });
        mainWindow.webContents.send('audio-files', audioFiles);
        mainWindow.webContents.send('team-names', teamNames);
    }
}

function fixWindowFocus() {
    mainWindow.blur();
    mainWindow.focus();
}

function setGlobalData(key, value) {
    currentSetup[key] = value;

    if (key === 'filePath' && value) {
        startFileWatcher(value);
        const { numTeams, numEntries } = currentSetup;
        const { scores, winningTeam } = readExcel(numTeams, numEntries, value);
        mainWindow.webContents.send('excel-updated', { scores, winningTeam });
    }
}

function readExcel(numTeams, numEntries, filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return { scores: [], winningTeam: null };
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const teamScores = Array(numTeams).fill(0);

    for (let i = 1; i <= numEntries; i++) {
        for (let j = 0; j < numTeams; j++) {
            teamScores[j] += data[i][j + 1];
        }
    }

    const winningTeam = teamScores.indexOf(Math.max(...teamScores)) + 1;

    return { scores: teamScores, winningTeam };
}

function startFileWatcher(filePath) {
    if (fileWatcher) {
        fileWatcher.close();
    }

    fileWatcher = chokidar.watch(filePath, { persistent: true });

    fileWatcher.on('change', () => {
        const { numTeams, numEntries } = currentSetup;
        const { scores, winningTeam } = readExcel(numTeams, numEntries, filePath);
        mainWindow.webContents.send('excel-updated', { scores, winningTeam });
    });
}

app.whenReady().then(() => {
    const dataFolder = path.join(app.getPath('documents'), 'Giro-413-data');

    if (!fs.existsSync(dataFolder)) {
        fs.mkdirSync(dataFolder, { recursive: true });

        const audio = path.join(__dirname, 'team_songs');
        const xlsx = path.join(__dirname, 'Pointscore.xlsx');
        fs.copySync(audio, dataFolder);    
        fs.copySync(xlsx, path.join(dataFolder, 'Pointscore.xlsx'));
    }

    createWindow();

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});