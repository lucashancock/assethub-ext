import * as vscode from "vscode";
import { fetchAssetsByUseCase, fetchUseCases } from "./services/assetService";

export type TreeNodeType = "usecase" | "asset";

export class TreeItemNode extends vscode.TreeItem {
  constructor(
    public readonly assetId: number,
    public readonly title: string,
    public readonly useDescription: string,
    public readonly author: string,
    public readonly nodeType: TreeNodeType,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly preRequisiteAssetIds?: number[],
    public readonly fields?: string,
    public readonly details?: string,
    public readonly parentId?: string
  ) {
    super(title, collapsibleState);
    if (nodeType === "asset") {
      this.command = {
        command: "treeViewExample.openLeaf",
        title: "Open Asset",
        arguments: [this],
      };
    }
    if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
      this.iconPath = new vscode.ThemeIcon("dash");
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

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: TreeItemNode): Promise<TreeItemNode[]> {
    if (!element) {
      const useCases = await fetchUseCases();
      return useCases.map((useCase) => {
        return new TreeItemNode(
          useCase.id,
          useCase.title,
          useCase.description,
          useCase.author,
          "usecase",
          vscode.TreeItemCollapsibleState.Collapsed,
          useCase.preRequisiteAssetIds
        );
      });
    } else if (element.nodeType === "usecase") {
      const assets = await fetchAssetsByUseCase(
        element.preRequisiteAssetIds || []
      );
      return assets.map(
        (asset, index) =>
          new TreeItemNode(
            asset.id,
            `${index + 1}. ${asset.title}`, // Add enumeration to the title
            asset.description,
            asset.author,
            "asset",
            vscode.TreeItemCollapsibleState.None,
            [],
            asset.preRequisites,
            asset.description,
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
