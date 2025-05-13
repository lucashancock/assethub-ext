import * as vscode from "vscode";
import { TreeDataProviderImpl, TreeItemNode } from "./TreeDataProvider";
import { openLeafWebview } from "./WebViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const treeDataProvider = new TreeDataProviderImpl();

  vscode.window.registerTreeDataProvider("treeViewExample", treeDataProvider);

  vscode.commands.registerCommand(
    "treeViewExample.openLeaf",
    (node: TreeItemNode) => {
      openLeafWebview(
        node.id ?? "",
        node.inputSchema ?? "No input schema defined."
      );
    }
  );
}
