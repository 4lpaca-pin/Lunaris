require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });

const headerTitle = document.getElementById("headerTitle");
const Minimize = document.getElementById("Minimize");
const endprocess = document.getElementById("endprocess");
const executeButton = document.getElementById("executeButton");
const AttachButton = document.getElementById("AttachButton");
const notifier = document.querySelector('.notifier');
const workspacefolder = document.getElementById("workspace-folder");
const AutoExecFolder = document.getElementById("auto-exec-folder");
const scriptlist = document.querySelector('.script-list');
const tablist = document.querySelector('.tablist');
const addtab = document.querySelector('.addtab');
const execdoc = document.getElementById('exec-doc');
const scrfolde = document.getElementById('scripts-folder');

workspacefolder.addEventListener("click",()=>{
  window.Lunaris.OpenWorkspace();
})

AutoExecFolder.addEventListener("click",()=>{
  window.Lunaris.AutoExecFolder();
})

scrfolde.addEventListener('click',()=>{
  window.Lunaris.ScriptListFolder();
})

const clearscriptitem = () => {
  scriptlist.querySelectorAll('.fast-button').forEach(e=>{
    e.remove()
  })
};

const setScriptList = async () => {
  const sr = await window.Lunaris.GetScriptsList();

  clearscriptitem();

  sr.forEach(e=>{
    const button = document.createElement("button");
    button.classList.add("fast-button");

    const icon = document.createElement("i");
    icon.classList.add("fa-solid", "fa-code");

    button.appendChild(icon);
    button.append(" " + e.name);

    scriptlist.appendChild(button);

    button.addEventListener('click',()=>{
      NewNotification("Execute","execute script " + e.name , 1000);
    })
  });
};

execdoc.addEventListener("click",()=>{
  window.Lunaris.OpenExternal("https://app.archbee.com/public/PREVIEW-2Jp4SDaAD4P1COFfx1p_t/PREVIEW-vVVNJMhdD7Krlmq7FHTM-");
})

setScriptList();

setTimeout(async () => {
  await setScriptList(); 
}, 100);

var NewNotification = (Title , Content , Duration) => {
  const notifierMain = document.createElement("div");
  notifierMain.classList.add("notifier-main", "hide");

  const h1 = document.createElement("h1");
  h1.classList.add("notifi-tit");
  h1.innerHTML = Title;

  const span = document.createElement("span");
  span.classList.add("notif-sss");
  span.innerHTML = Content;

  notifierMain.appendChild(h1);
  notifierMain.appendChild(span);

  notifier.appendChild(notifierMain);

  setTimeout(() => {
    notifierMain.classList.remove("hide");
  }, 5);

  setTimeout(() => {
    notifierMain.classList.add("hide");

    setTimeout(() => {
      notifierMain.remove();
    }, 500);
  }, Duration || 5000);
}

Minimize.addEventListener('click',()=>{
  window.Lunaris.Minimize();
})

endprocess.addEventListener('click',()=>{
  window.Lunaris.Close();
})

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

headerTitle.innerHTML = randomString(100);

require(['vs/editor/editor.main'], function () {
    let CurrentEditor;
    const ws = new WebSocket("ws://localhost:3000");

    const tabs = [];
    let NewEditor = (name , source) => {
      const button = document.createElement("button");
      button.classList.add("tab-button");

      const icon = document.createElement("i");
      icon.classList.add("fa-solid", "fa-pen-to-square");

      button.appendChild(icon);
      button.append(" " + name);
      tablist.appendChild(button);

      const container = document.createElement("div");
        container.className = "editor-main";
        container.style.display = "block";

        document.getElementById('editors').appendChild(container);

        var editor = monaco.editor.create(container, {
          value: source,
          theme: "vs-dark",
          language: 'lua',
          automaticLayout: true,
        });

        CurrentEditor = editor;

      const refapi = {
        setvisible: (value) => {
          if (value) {
            container.style.display = "block";
            icon.classList.remove("fa-code");
            icon.classList.add("fa-pen-to-square");
            CurrentEditor = editor;
          } else {
            icon.classList.add("fa-code");
            icon.classList.remove("fa-pen-to-square");
            container.style.display = "none";
          }
        },
        delete: () => {
          editor.dispose();
          container.delete();
        },
        name: name,
        source: source,
        button: button,
        editor: editor,
      };

      editor.REF_API = refapi;

      button.addEventListener('click',()=>{
        if (CurrentEditor) {
          CurrentEditor.REF_API.source = CurrentEditor.getValue();
          CurrentEditor.REF_API.setvisible(false);

          refapi.setvisible(true);

          CurrentEditor = editor;
        }
      });

      tabs.push(refapi);

      return refapi;
    }

    const checkTab = ()=>{
      tabs.forEach(ed => {
          if (ed.editor != CurrentEditor) {
            console.log(ed)
            ed.editor.REF_API.setvisible(false)
          } else {
            ed.editor.REF_API.setvisible(true)
          }
        });
    }

    const initTabs = () =>{
      const l = window.Lunaris.GetTabs();
  
      l.then(e=>{
        e.forEach(e=>{
          NewEditor(e.Name , e.Text)
        })
      })

      setTimeout(checkTab, 100);
    };

    initTabs();

    addtab.addEventListener('click',()=>{
      NewEditor("Tab" + (tabs.length).toString() + ".lua" , "-- Welcome to Lunaris / Seliware")

      setTimeout(checkTab, 5);
    })

    executeButton.addEventListener('click',()=>{
      if (CurrentEditor) {
        Execute(CurrentEditor.getValue());
      }
    })

    ws.onopen = ()=>{
      ws.send("LuarisClient");

      ws.onmessage = (event) => {
        if (event.data == "Injected") {
          NewNotification("Seliware","Injected to Roblox Process");
        } else if (event.data == "InjectError") {
          NewNotification("Seliware","Failed to Inject");
        } else if (event.data == "ScriptListChanged") {
          setScriptList()
        }
      };
    };

    const SaveTabs = () => {
      const bin = [];

      tabs.forEach(e=>{
        bin.push({
          Name: e.name,
          Text: e.editor.getValue()
        })
      });

      window.Lunaris.SaveTabs(JSON.stringify(bin));
    }

    setInterval(SaveTabs,10000)

    AttachButton.addEventListener("click",()=>{
      NewNotification("Seliware","Injecting to Roblox");

      Inject();
    })
});

NewNotification("Lunaris","Custom UI for Seliware Executor<br>Author: 4lpaca License MIT")
