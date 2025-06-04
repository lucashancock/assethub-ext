import * as vscode from "vscode";
import { TreeItemNode } from "./TreeDataProvider";
import { actOnAssets, parsePreRequisites } from "./services/assetService";

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

  panel.webview.onDidReceiveMessage(async (message) => {
    try {
      // catch the message from the html to run command run the act on assets command
      // it comes with command, assetId, and input args
      if (message.command === "runCommand") {
        console.log(message.assetId, message.args);
        // await the response from act on assets
        const response = await actOnAssets(message.assetId, message.args);
        console.log(response);
        if (response.data.configData.success === true) {
          panel.webview.postMessage({
            type: "command-result",
            success: true,
            message:
              response.data.message +
              "\n\n" +
              simpleTextRowsFromString(response.data.configData.result),
          });
        } else {
          panel.webview.postMessage({
            type: "command-result",
            success: false,
            message:
              `Error running command: ${response.data.message}` +
              "\n\n" +
              simpleTextRowsFromString(response.data.configData.result),
          });
        }
      }
      // get the result and post that the webview
    } catch (error: any) {
      panel.webview.postMessage({
        type: "command-result",
        success: false,
        message: `API error: ${error.message}`,
      });
    }
  });
}
function simpleTextRowsFromString(jsonString: string) {
  let jsonArray;
  try {
    jsonArray = JSON.parse(jsonString);
  } catch (e) {
    return '<p class="text-red-500">Invalid JSON Parse. Providing stringified version.</p><p>jsonString</p>';
  }

  if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
    return "<p>No data available.</p>";
  }

  const html = jsonArray
    .map((item) => {
      const row = Object.entries(item)
        .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
        .join("");
      return `<div class="mb-4 p-3 border rounded">${row}</div>`;
    })
    .join("");

  return html;
}

function getWebviewContent(node: TreeItemNode): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Task: ${node.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Set the base colors to vscode theme variables */
    body {
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    hr {
      border-color: var(--vscode-editorWidget-border);
    }
    .border {
      border-color: var(--vscode-editorWidget-border);
    }
    button {
      background-color: var(--vscode-button-background);       
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-input-border); 
    }
    button:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    input, textarea {
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-color: var(--vscode-input-border);
    }
    input:focus, textarea:focus {
      border-color: var(--vscode-focusBorder);
      outline: none;
    }
    .spinner {
      width: 30px;
      height: 30px;
      border: 4px solid transparent;
      border-top-color: var(--vscode-editor-foreground);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--vscode-editor-background);
    }
    ::-webkit-scrollbar-thumb {
      background-color: var(--vscode-scrollbarSlider-background);
      border-radius: 10px;
    }

    /* Link colors */
    a {
      color: var(--vscode-textLink-foreground);
    }
    a:hover {
      color: var(--vscode-textLink-activeForeground);
    }

  </style>
</head>
<body class="font-sans p-8 max-w-6xl mx-auto">

  <h1 class="text-2xl font-bold mb-2">${node.title}</h1>
  <hr class="mb-5" />

  <div class="flex flex-col md:flex-row gap-6">

    <!-- Left Column: Info and Inputs -->
    <div class="flex flex-col space-y-4 md:w-1/2">

      <!-- Information Section -->
      <div class="space-y-2">
        <h4 class="text-xl font-semibold">Information</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <span class="font-mono">ID: ${node.assetId}</span>
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 whitespace-normal break-words">
          <span class="font-mono">${node.useDescription}</span>
        </p>
      </div>

      <!-- Inputs Section -->
      <div class="space-y-2 w-[95%]">
        <h4 class="text-xl font-semibold">Inputs</h4>
        <div class="space-y-2">
          ${getInputHTML(node)}
        </div>
      </div>

      <!-- Execute Button -->
      <div class="space-y-2">
        <h4 class="text-xl font-semibold">Execute</h4>
        <button
          id="runCommandButton"
          disabled
          class="px-4 py-2 border rounded transition duration-200"
        >
          Act on Asset
        </button>
      </div>
    </div>

    <!-- Right Column: Output -->
    <div class="w-full md:w-1/2">
      <!-- Title and Clear button -->
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xl font-semibold">Output</h4>
        <button
          id="clearOutput"
          class="text-sm p-1 rounded opacity-50 hover:opacity-100 transition duration-200"
          title="Clear output"
        >
          Clear
        </button>
      </div>

      <!-- Output box -->
      <div
        class="overflow-auto relative h-full max-h-[800px] text-sm  font-mono p-4 rounded border"
      >
          <div
            id="result"
            class="whitespace-pre-wrap break-words"
          >No output yet.</div>

        <div id="loadingSpinner" class="hidden mt-1">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </div>
</body>
<script>
  const vscode = acquireVsCodeApi();
  const runButton = document.getElementById("runCommandButton");
  const inputs = document.querySelectorAll("input");

  // Check input validity
  function validateInputs() {
    const requiredInputs = Array.from(inputs).filter((input) => input.required);

    const allFilled = requiredInputs.every((input) => input.value.trim());

    if (allFilled) {
      runButton.disabled = false;
      runButton.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      runButton.disabled = true;
      runButton.classList.add("opacity-50", "cursor-not-allowed");
    }
  }

  // Listen to all input changes
  inputs.forEach((input) => {
    input.addEventListener("input", validateInputs);
  });

  // Click handler for Run Command button
  runButton.addEventListener("click", () => {
    if (runButton.disabled) {
      alert("Please fill in all required input fields before running the command.");
      return;
    }

    const args = {};
    inputs.forEach((input) => {
      if (input.value.trim() !== "") {
        args[input.name] = input.value;
      }
    });

    document.getElementById("result").innerHTML = "";
    document.getElementById("loadingSpinner").classList.remove("hidden");

    vscode.postMessage({
      command: "runCommand",
      args,
      assetId: ${node.assetId},
    });
  });

  // Clear output handler
  document.getElementById("clearOutput").addEventListener("click", () => {
    document.getElementById("result").innerHTML = "<p>No output yet.</p>";
    document.getElementById("loadingSpinner").classList.add("hidden");
  });

  // Receive message from extension
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "command-result") {
      document.getElementById("loadingSpinner").classList.add("hidden");
      document.getElementById("result").innerHTML = message.message;
    }
  });

  // Initial validation on page load
  validateInputs();
</script>


</html>
  `;
}

function getInputHTML(node: TreeItemNode): string {
  const fieldsObj = parsePreRequisites(node.fields ?? "");
  if (!fieldsObj || !fieldsObj.fields) {
    return `<p class="text-base">No fields defined.</p>`;
  }

  const inputsHTML = fieldsObj.fields
    .map(
      (field) => `
        <label for="${field.name}" class="block font-semibold text-base">
          ${field.name} 
          <span class="text-sm font-semibold text-red-500">${
            field.optional === false ? " * " : ""
          }</span>
        </label>
        <input
          ${field.optional === false ? "required" : ""}
          type="${field.type === "string" ? "text" : field.type}"
          id="${field.name}"
          name="${field.name}"
          placeholder="${
            field.name + (field.optional === false ? " (required)" : "")
          }"
          value="${field.default ? field.default : ""}"
          class="block w-full rounded-md border text-sm p-2"
        />
      `
    )
    .join("\n");

  return `<form class="space-y-2">${inputsHTML}</form>`;
}
