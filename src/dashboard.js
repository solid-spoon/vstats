const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { state, reset, save } = require("./state");

let panel = null;

function openDashboard(context) {
  if (panel) {
    panel.reveal();
    return;
  }

  panel = vscode.window.createWebviewPanel(
    "vstats",
    "VStats",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
    },
  );

  const media = vscode.Uri.joinPath(context.extensionUri, "media");
  const html0 = fs.readFileSync(path.join(media.fsPath, "panel.html"), "utf8");

  const scripts = ["icons", "helpers", "render", "recap", "panel"];
  let html = html0.replace(
    "{{css}}",
    panel.webview
      .asWebviewUri(vscode.Uri.joinPath(media, "panel.css"))
      .toString(),
  );
  for (const f of scripts) {
    const uri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(media, `${f}.js`),
    );
    html = html.replace(`{{${f}}}`, uri.toString());
  }
  panel.webview.html = html;

  panel.webview.onDidReceiveMessage(async (msg) => {
    if (msg.type === "ready") {
      post();
    } else if (msg.type === "reset") {
      reset();
      save();
      post();
    } else if (msg.type === "savePng") {
      try {
        const base64 = String(msg.dataUrl).replace(
          /^data:image\/png;base64,/,
          "",
        );
        const buf = Buffer.from(base64, "base64");
        const uri = await vscode.window.showSaveDialog({
          filters: { PNG: ["png"] },
          defaultUri: vscode.Uri.file(
            path.join(os.homedir(), msg.filename || "vstats-recap.png"),
          ),
        });
        if (!uri) return;
        fs.writeFileSync(uri.fsPath, buf);
        vscode.window.showInformationMessage(`VStats: saved to ${uri.fsPath}`);
      } catch (e) {
        vscode.window.showErrorMessage("VStats: save PNG failed: " + e.message);
      }
    }
  });

  panel.onDidDispose(() => {
    panel = null;
  });
}

// lazy require to avoid a circular dep with tracking.js
function post() {
  if (!panel) return;
  const tracking = require("./tracking");
  panel.webview.postMessage({
    type: "stats",
    payload: state,
    live: tracking.computeLiveRates(),
  });
}

module.exports = { openDashboard, post };
