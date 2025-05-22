import * as vscode from "vscode";
import { TreeItemNode } from "./TreeDataProvider";
import {
  PreRequisites,
  parsePreRequisites,
  getCommandToRun,
} from "./services/assetService";

const panelMap: Map<number, vscode.WebviewPanel> = new Map();

export function openLeafWebview(node: TreeItemNode) {
  const existingPanel = panelMap.get(node.assetId);
  if (existingPanel) {
    existingPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "leafView",
    node.title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true, // Prevent reload
    }
  );

  panel.webview.html = getWebviewContent(node);
  panelMap.set(node.assetId, panel);

  panel.onDidDispose(() => {
    panelMap.delete(node.assetId); // Clean up when closed
  });

  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === "runCommand") {
      console.log(message);
      const command = getCommandToRun(
        node.assetId,
        message.assetId,
        message.args
      );
      runCommandInTerminal(command, panel);
    }
  });
}

function getWebviewContent(node: TreeItemNode): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Task: ${node.title}</title>
  <style>
    :root {
      color-scheme: light dark; /* Enables automatic color adaptation in supported browsers */
    }
    input {
      width: 50%;
      margin: 5px;
    }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 14px);
      padding: 1rem;
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
    }

    h1 {
      color: var(--vscode-editor-foreground);
    }

    button {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body class="vscode-body">
  <h1>${node.title}</h1>
  <hr size=1></hr>
  <h4>Information</h4>
  <p>${node.description}</p>
  <p>Id: ${node.assetId}</p>
  <hr size=1></hr>
  <h4>Inputs</h4>
  <p>${getInputHTML(node)}</p>
  <hr size=1></hr>
  <h4>Execute</h4>
  <button id="runCommandButton">Run command in terminal</button>
  <div id="result"></div>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById("runCommandButton").addEventListener("click", () => {
      const inputs = document.querySelectorAll("input");
      const args = {};
      inputs.forEach((input) => {
        args[input.name] = input.value;
      })

      document.getElementById("result").textContent = "Running...";

      vscode.postMessage({ command: "runCommand", args, assetId: ${
        node.assetId
      }});
    });

    window.addEventListener("message", event => {
      const message = event.data;
      if (message.type === "command-result") {
        document.getElementById("result").textContent = message.message;
      }
    });
  </script>
</body>
</html>
`;
}

function getInputHTML(node: TreeItemNode): string {
  const fieldsObj = parsePreRequisites(node.fields ?? "");
  if (!fieldsObj || !fieldsObj.fields) {
    return "<p>No fields defined.</p>";
  }

  const inputsHTML = fieldsObj.fields
    .map(
      (field) => `
      <label for="${field.name}" style="display:block; margin-bottom: 8px;">
        ${field.name}:
        <input type="${field.type === "string" ? "text" : field.type}" id="${
        field.name
      }" name="${field.name}" />
      </label>
    `
    )
    .join("\n");

  return `<form>${inputsHTML}</form>`;
}

function runCommandInTerminal(command: string, panel: vscode.WebviewPanel) {
  try {
    const task = new vscode.Task(
      { type: "shell" },
      vscode.TaskScope.Workspace,
      "Run Command",
      "extension",
      new vscode.ShellExecution(command)
    );

    // Run command and send back result to WebView
    const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
      if (e.execution.task.name === "Run Command") {
        panel.webview.postMessage({
          type: "command-result",
          success: e.exitCode === 0,
          message:
            e.exitCode === 0
              ? "Command ran, check terminal for output."
              : "Command failed.",
        });
        disposable.dispose(); // Clean up
      }
    });

    vscode.tasks.executeTask(task);
  } catch (error) {
    panel.webview.postMessage({
      type: "command-result",
      success: false,
      message: `Error running command: ${error}`,
    });
  }
}
