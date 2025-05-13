import * as vscode from "vscode";

const panelMap: Map<string, vscode.WebviewPanel> = new Map();

export function openLeafWebview(id: string, content: string) {
  const existingPanel = panelMap.get(id);
  if (existingPanel) {
    existingPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "leafView",
    id,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true, // Prevent reload
    }
  );

  panel.webview.html = getWebviewContent(id, content);
  panelMap.set(id, panel);

  panel.onDidDispose(() => {
    panelMap.delete(id); // Clean up when closed
  });

  panel.webview.onDidReceiveMessage((message) => {
    if (message.command === "runCommand") {
      const command = getCommandToRun(id);
      runCommandInTerminal(command, panel);
    }
    // if (message.anyprophere === "any") {
    //  // Handle any other messages/commands here, can be API driven.
    // }
  });
}

function getWebviewContent(id: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Task: ${id}</title>
  <style>
    :root {
      color-scheme: light dark; /* Enables automatic color adaptation in supported browsers */
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

    #result {
      margin-top: 1rem;
      color: var(--vscode-input-foreground);
    }
  </style>
</head>
<body class="vscode-body">
  <h1>Id: ${id}</h1>
  <p>${content} (this is where form content can be dynamically loaded from an API)</p>
  <button id="runCommandButton">Run command in terminal</button>
  <div id="result"></div>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById("runCommandButton").addEventListener("click", () => {
      document.getElementById("result").textContent = "Running...";
      vscode.postMessage({ command: "runCommand" });
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
            e.exitCode === 0 ? "Command ran successfully!" : "Command failed.",
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

function getCommandToRun(taskid: string): string {
  // Replace with your logic to get the command based on task ID
  return `echo Running task ${taskid}; echo Task completed!`;
}
