import * as vscode from "vscode";
import { ConfigManager } from "./config";
import { ScriptManager } from "./scripts";
import { runScript } from "./scriptRunner";
import { ScriptBarWebviewProvider } from "./webviewProvider";

export function activate(context: vscode.ExtensionContext) {
	try {
		const configManager = new ConfigManager();
		const scriptManager = new ScriptManager(configManager);

		const provider = new ScriptBarWebviewProvider(
			context.extensionUri,
			() => scriptManager.getScripts(),
			() => scriptManager.getState(),
			() => scriptManager.workspaceRoot
		);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				ScriptBarWebviewProvider.viewType,
				provider
			)
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(
				"package-script-bar.runScript",
				(scriptName: string, runMode: "background" | "terminal") => {
					const cwd = scriptManager.workspaceRoot;
					if (!cwd) {
						vscode.window.showErrorMessage("No workspace folder open.");
						return;
					}
					runScript(scriptName, runMode ?? "background", cwd);
				}
			)
		);

		context.subscriptions.push(
			vscode.commands.registerCommand("package-script-bar.rescan", async () => {
				await configManager.init();
				await scriptManager.rescan();
				await provider.refresh();
				vscode.window.showInformationMessage(
					"Package Script Bar: Rescanned package.json."
				);
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(
				"package-script-bar.showScriptBar",
				() => {
					provider.reveal();
					// Focus Explorer so Script Bar is visible if view not yet resolved
					void vscode.commands.executeCommand("workbench.view.explorer");
				}
			)
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(
				"package-script-bar.openSettings",
				async () => {
					const uri = configManager.configFilePath;
					if (!uri) {
						vscode.window.showErrorMessage("No workspace folder open.");
						return;
					}
					await configManager.init();
					await configManager.ensureExists();
					const doc = await vscode.workspace.openTextDocument(uri);
					await vscode.window.showTextDocument(doc);
				}
			)
		);

		const initAndRefresh = async () => {
			await configManager.init(async () => {
				await provider.refresh();
			});
			await provider.refresh();
		};

		initAndRefresh();

		context.subscriptions.push(
			vscode.workspace.onDidChangeWorkspaceFolders(() => initAndRefresh())
		);
		context.subscriptions.push(configManager);

		void vscode.window
			.showInformationMessage(
				'Package Script Bar loaded. Use the Command Palette (Ctrl+Shift+P) and run "Show Script Bar" to open it.',
				"Show Script Bar"
			)
			.then((choice) => {
				if (choice === "Show Script Bar") {
					void vscode.commands.executeCommand(
						"package-script-bar.showScriptBar"
					);
				}
			});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		void vscode.window.showErrorMessage(
			`Package Script Bar failed to activate: ${message}`
		);
		console.error("Package Script Bar activation error:", err);
	}
}

export function deactivate() {}
