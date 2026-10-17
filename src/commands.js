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
const dashboard = require("./dashboard");
const statusBar = require("./statusbar");
const { levelFromXp } = require("./helpers");

function storagePath(context) {
  return path.resolve(context.globalStorageUri.fsPath, "stats.json");
}

function register(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("vstats.openDashboard", () =>
      dashboard.openDashboard(context),
    ),

    vscode.commands.registerCommand("vstats.mergeStats", async () => {
      const uris = await vscode.window.showOpenDialog({
        filters: { JSON: ["json"] },
        canSelectMany: false,
        openLabel: "Merge this file into current stats",
      });
      if (!uris || !uris.length) return;

      try {
        const raw = fs.readFileSync(uris[0].fsPath, "utf8");
        const imported = JSON.parse(raw);
        const { mergeStats } = require("./merger");

        // We merge the file INTO the current live state
        const merged = mergeStats(state, imported);
        replace(normalizeState(merged));

        save();
        statusBar.update();
        dashboard.post();

        vscode.window.showInformationMessage(
          `VStats: Merged successfully. Total: ${(merged.totalMs / 3600000).toFixed(1)}h, Level ${levelFromXp(merged.xp)}.`
        );
      } catch (e) {
        vscode.window.showErrorMessage("VStats merge failed: " + e.message);
      }
    }),

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
