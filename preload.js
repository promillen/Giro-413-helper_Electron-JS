const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
    getPath: () => path,
    getDocumentsPath: () => ipcRenderer.invoke('get-documents-path'),
    
    // Methods for global data
    setGlobalData: (key, value) => ipcRenderer.invoke('set-global-data', key, value),
    getGlobalData: (key) => ipcRenderer.invoke('get-global-data', key),
    getGlobalDataSync: (key) => ipcRenderer.sendSync('get-global-data-sync', key),

    // Navigation and focus fix
    sendFocusFix: () => ipcRenderer.send('focus-fix'),
    navigate: (page) => ipcRenderer.send('navigate', page),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    onExcelData: (callback) => ipcRenderer.on('excel-data', (event, data) => callback(data)),
    onExcelUpdated: (callback) => ipcRenderer.on('excel-updated', (event, data) => callback(data)),
});