import * as vscode from "vscode";
import { TreeDataProviderImpl, TreeItemNode } from "./TreeDataProvider";
import { openLeafWebview } from "./WebViewProvider";
import { UseCaseBuilderProvider } from "./UseCaseBuilderWebViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const treeDataProvider = new TreeDataProviderImpl();
  const useCaseBuilderProvider = new UseCaseBuilderProvider(
    context.extensionUri
  );
  vscode.window.registerTreeDataProvider("treeViewExample", treeDataProvider);
  vscode.window.registerWebviewViewProvider(
    "useCaseCreationView",
    useCaseBuilderProvider
  );
  vscode.commands.registerCommand(
    "treeViewExample.openLeaf",
    (node: TreeItemNode) => {
      openLeafWebview(node);
    }
  );

  vscode.commands.registerCommand("treeViewExample.refresh", () => {
    treeDataProvider.refresh();
  });
}
