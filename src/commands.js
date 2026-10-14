const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  state,
  reset,
  save,
  normalizeState,
  defaultState,
  replace,
} = require("./state");
const { checkAchievements } = require("./achievements");
const dashboard = require("./dashboard");
const statusBar = require("./statusbar");

function storagePath(context) {
  return path.resolve(context.globalStorageUri.fsPath, "stats.json");
}

function register(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vstats.openDashboard", () =>
      dashboard.openDashboard(context),
    ),

    vscode.commands.registerCommand("vstats.showStoragePath", async () => {
      const p = storagePath(context);
      if (!fs.existsSync(p)) {
        vscode.window.showInformationMessage(
          `VStats: no stats file yet at ${p}`,
        );
        return;
      }
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));
      await vscode.window.showTextDocument(doc);
    }),

    vscode.commands.registerCommand("vstats.resetStats", () => {
      reset();
      save();
      statusBar.update();
      dashboard.post();
      vscode.window.showInformationMessage("VStats: stats reset.");
    }),

    vscode.commands.registerCommand("vstats.exportStats", async () => {
      const uri = await vscode.window.showSaveDialog({
        filters: { JSON: ["json"] },
        defaultUri: vscode.Uri.file(
          path.join(os.homedir(), "vstats-export.json"),
        ),
      });
      if (!uri) return;
      try {
        fs.writeFileSync(uri.fsPath, JSON.stringify(state, null, 2));
        vscode.window.showInformationMessage(
          `VStats exported to ${uri.fsPath}`,
        );
      } catch (e) {
        vscode.window.showErrorMessage("VStats export failed: " + e.message);
      }
    }),

    vscode.commands.registerCommand("vstats.importStats", async () => {
      const uris = await vscode.window.showOpenDialog({
        filters: { JSON: ["json"] },
        canSelectMany: false,
      });
      if (!uris || !uris.length) return;
      try {
        const raw = fs.readFileSync(uris[0].fsPath, "utf8");
        const parsed = JSON.parse(raw);
        replace(normalizeState(Object.assign(defaultState(), parsed)));
        save();
        statusBar.update();
        dashboard.post();
        vscode.window.showInformationMessage("VStats imported.");
      } catch (e) {
        vscode.window.showErrorMessage("VStats import failed: " + e.message);
      }
    }),
  );
}

module.exports = { register };
