// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Lunaris', {
  getExecutorPath: () => ipcRenderer.invoke("getexecutorpath"),
  Inject: (pid) => ipcRenderer.invoke("inject" , pid),
  Execute: (source) => ipcRenderer.invoke("Execute",source),
  Minimize: () => ipcRenderer.invoke("Minimize"),
  Close: () => ipcRenderer.invoke("Close"),
  OpenWorkspace: () => ipcRenderer.invoke("OpenWorkspace"),
  AutoExecFolder: () => ipcRenderer.invoke("AutoExecFolder"),
  GetScriptsList: () => ipcRenderer.invoke("GetScriptsList"),
  GetTabs: () => ipcRenderer.invoke("GetTabs"),
  OpenExternal: (url) => ipcRenderer.invoke("OpenExternal" , url),
  ScriptListFolder: () => ipcRenderer.invoke("ScriptListFolder"),
  SaveTabs: (code) => ipcRenderer.invoke('SaveTabs',code)
});