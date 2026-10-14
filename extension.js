const app = require("./src/app");

function activate(context) {
  app.start(context);
}
function deactivate() {
  app.stop();
}

module.exports = { activate, deactivate };
