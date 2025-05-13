import * as vscode from "vscode";

export type TreeNodeType = "asset" | "task";

export class TreeItemNode extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly nodeType: TreeNodeType,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly inputSchema?: string,
    public readonly details?: string,
    public readonly parentId?: string
  ) {
    super(label, collapsibleState);
    if (nodeType === "task") {
      this.command = {
        command: "treeViewExample.openLeaf",
        title: "Open Task",
        arguments: [this],
      };
    }
  }
}

export class TreeDataProviderImpl
  implements vscode.TreeDataProvider<TreeItemNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItemNode | undefined> =
    new vscode.EventEmitter<TreeItemNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemNode | undefined> =
    this._onDidChangeTreeData.event;

  async getChildren(element?: TreeItemNode): Promise<TreeItemNode[]> {
    if (!element) {
      const assets = await fetchAssets();
      return assets.map(
        (asset) =>
          new TreeItemNode(
            asset.id,
            asset.name,
            "asset",
            vscode.TreeItemCollapsibleState.Collapsed
          )
      );
    } else if (element.nodeType === "asset") {
      const tasks = await fetchTasks(element.id);
      return tasks.map(
        (task) =>
          new TreeItemNode(
            task.id,
            task.name,
            "task",
            vscode.TreeItemCollapsibleState.None,
            "Schema here",
            task.description,
            element.id
          )
      );
    }

    return [];
  }

  getTreeItem(element: TreeItemNode): vscode.TreeItem {
    return element;
  }
}

// Fake API functions:

async function fetchAssets(): Promise<{ id: string; name: string }[]> {
  await delay(200); // simulate network
  return [
    { id: "asset1", name: "Asset One" },
    { id: "asset2", name: "Asset Two" },
    { id: "asset3", name: "Asset Three" },
  ];
}

async function fetchTasks(
  assetId: string
): Promise<{ id: string; name: string; description: string }[]> {
  await delay(200); // simulate network
  return [
    {
      id: `${assetId}-task1`,
      name: `Task 1 for ${assetId}`,
      description: "Task 1 details",
    },
    {
      id: `${assetId}-task2`,
      name: `Task 2 for ${assetId}`,
      description: "Task 2 details",
    },
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
