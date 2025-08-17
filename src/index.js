const { app, BrowserWindow , ipcMain, shell } = require('electron');
const path = require('node:path');
const { execFile , exec} = require("child_process");
const WebSocket = require("ws");
const util = require('util');
const child_process = require("node:child_process");
const execAsync = util.promisify(child_process.exec);
const fs = require('fs');

if (require('electron-squirrel-startup')) {
  app.quit();
}

function RandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

async function GetProcesses(name) {
    try {
        const { stdout, stderr } = await execAsync('tasklist', { encoding: 'utf8' });
        const lines = stdout.split('\n');
        const robloxProcesses = lines.filter(line => line.includes(name));
        const pids = robloxProcesses.map(line => {
            const columns = line.trim().split(/\s+/);
            return columns[1].toString();
        });
        return pids;
    }
    catch (error) {
        return [];
    }
};

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
const seliscripts = localAppData + "\\seliware-scripts";
let socketClient;

const createWindow = () => {
  const wss = new WebSocket.Server({ port: 3000 }, () => {
    console.log("ws://127.0.0.1:3000");
  });

  const mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 646,
    minHeight: 432,
    height: 600,
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "assets/moon.png"),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  wss.on("connection",(ws, req)=>{
    console.log("new connection detected")

    ws.on('message',(e)=>{
      if (e.toString() == "LuarisClient") {
        socketClient = ws;
      }
    })
  });

  ipcMain.handle("Execute",(_,source) => {
    const message = JSON.stringify({
      command: "execute",
      value: source
    });

    console.log(source);

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  });

  ipcMain.handle("Minimize",() => {
    mainWindow.minimize();
  });

  fs.watch(seliscripts, () =>{
      if (socketClient) {
        socketClient.send("ScriptListChanged")
      };
  })

  ipcMain.handle("Close",() => {
    app.quit();
  });
};

const ExecPath = () => {
  return app.getPath("appData") + "\\Seliware";
}

ipcMain.handle("SaveTabs",(_,code)=>{
   const execbin = ExecPath() + "\\bin\\tabs.json";
  console.log(execbin)
   fs.writeFileSync(execbin,code);
})

ipcMain.handle("AutoExecFolder",()=>{
  let path = localAppData + "\\seliware-autoexec";

  exec(`explorer  "${path}"`, (err) => {
    if (err) console.error("Failed to open folder:", err);
  });
})

ipcMain.handle("ScriptListFolder",()=>{
  let path = localAppData + "\\seliware-scripts";

  exec(`explorer  "${path}"`, (err) => {
    if (err) console.error("Failed to open folder:", err);
  });
});

ipcMain.handle("OpenWorkspace",()=>{
  let path = localAppData + "\\seliware-workspace";

  exec(`explorer  "${path}"`, (err) => {
    if (err) console.error("Failed to open folder:", err);
  });
});

ipcMain.handle("GetTabs", async () =>{
  const execbin = ExecPath() + "\\bin\\tabs.json";

  const js = fs.readFileSync(execbin);
  const par = JSON.parse(js.toString());
  console.log(par)
  return par;
});

ipcMain.handle("GetScriptsList", async () =>{
  const files = fs.readdirSync(seliscripts, { withFileTypes: true });
  const oo = [];

  for (const entry of files) {
    if (entry.isFile()) {
      const content = fs.readFileSync(seliscripts + "\\" + entry.name);

      oo.push({
        name: entry.name,
        content: content.toString(),
      });
    }
  }

  return oo;
});
ipcMain.handle('OpenExternal',(_,url)=>{
  console.log(url)
  shell.openExternal(url.toString());
})

ipcMain.handle("getexecutorpath",ExecPath);

ipcMain.handle("inject",() => {
  let pid = GetProcesses("RobloxPlayerBeta");

  pid.then((robloxpid)=>{
    console.log(robloxpid);
    execFile(ExecPath() + "\\Injector.exe" , [robloxpid] , {
      cwd: ExecPath(),
      stdio: 'inherit'
    } , (error, stdout, stderr) => {
      if (error) {
        if (socketClient) {
          socketClient.send("InjectError")
        };
        return;
      }

      console.log(stdout);

      if (stdout.match("Incompatible Roblox version")) { // roblox version
        return socketClient.send("InjectError");
      }

      if (socketClient) {
        socketClient.send("Injected")
      };
  });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
