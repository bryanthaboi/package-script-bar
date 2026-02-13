import * as vscode from "vscode";
import type { ScriptItem } from "./types";
import { runScript } from "./scriptRunner";

export class ScriptBarWebviewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "package-script-bar.scriptBar";

	private _view?: vscode.WebviewView;
	private _scripts: ScriptItem[] = [];
	private _state: "no-workspace" | "no-package" | "no-scripts" | "ready" =
		"no-workspace";
	private _cwd: string = "";

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private getScripts: () => Promise<ScriptItem[]>,
		private getState: () => Promise<
			"no-workspace" | "no-package" | "no-scripts" | "ready"
		>,
		private getCwd: () => string | undefined
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void | Thenable<void> {
		this._view = webviewView;
		const scriptUri = vscode.Uri.joinPath(
			this._extensionUri,
			"media",
			"scriptBar.js"
		);
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "media")],
		};
		webviewView.webview.html = this._getHtml(webviewView.webview, scriptUri);
		this._refreshData();

		webviewView.webview.onDidReceiveMessage(
			async (data: { command: string; scriptName: string }) => {
				if (data.command === "run" && data.scriptName) {
					const cwd = this.getCwd();
					if (!cwd) {
						return;
					}
					const item = this._scripts.find((s) => s.name === data.scriptName);
					const runMode = item?.config.runMode ?? "background";
					await runScript(data.scriptName, runMode, cwd);
				}
			}
		);
	}

	/** Reveal the Script Bar view (e.g. when user runs "Show Script Bar" command). */
	public reveal(): void {
		if (this._view) {
			this._view.show?.(true);
		}
	}

	async refresh(): Promise<void> {
		await this._refreshData();
		if (this._view) {
			const scriptUri = vscode.Uri.joinPath(
				this._extensionUri,
				"media",
				"scriptBar.js"
			);
			this._view.webview.html = this._getHtml(this._view.webview, scriptUri);
		}
	}

	private async _refreshData(): Promise<void> {
		this._scripts = await this.getScripts();
		this._state = await this.getState();
		this._cwd = this.getCwd() ?? "";
	}

	private _getHtml(webview: vscode.Webview, scriptUri: vscode.Uri): string {
		const isEmpty = this._scripts.length === 0;
		let message = "";
		if (this._state === "no-workspace") {
			message = "Open a folder to use Package Script Bar.";
		} else if (this._state === "no-package") {
			message = "No package.json found in workspace root.";
		} else if (this._state === "no-scripts" || isEmpty) {
			message = "No scripts in package.json.";
		}

		const buttonsHtml = this._scripts
			.map(
				(s) => `
				<button
					class="script-btn"
					data-script="${escapeHtml(s.name)}"
					style="--btn-color: ${s.config.color ?? "#4CAF50"};"
					title="${escapeHtml(s.name)}"
				>${escapeHtml(s.config.nickname ?? s.name)}</button>
			`
			)
			.join("");

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		* { box-sizing: border-box; }
		body {
			margin: 0;
			padding: 8px 12px;
			font-family: var(--vscode-font-family, system-ui, sans-serif);
			font-size: 13px;
			background: transparent;
		}
		.toolbar {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			align-items: center;
			min-height: 28px;
		}
		.script-btn {
			--btn-color: #4CAF50;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 4px 10px;
			border: none;
			border-radius: 6px;
			background: var(--btn-color);
			color: white;
			font-size: 12px;
			font-weight: 500;
			cursor: pointer;
			transition: transform 0.1s, box-shadow 0.1s;
			text-shadow: 0 0 1px rgba(0,0,0,0.3);
		}
		.script-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 2px 6px rgba(0,0,0,0.25);
		}
		.script-btn:active {
			transform: translateY(0);
			box-shadow: 0 1px 2px rgba(0,0,0,0.2);
		}
		.empty-state {
			color: var(--vscode-descriptionForeground);
			font-size: 12px;
			padding: 4px 0;
		}
	</style>
</head>
<body>
	<div class="toolbar">
		${isEmpty ? `<span class="empty-state">${message}</span>` : buttonsHtml}
	</div>
	<script src="${escapeHtml(
		webview.asWebviewUri(scriptUri).toString()
	)}"></script>
</body>
</html>`;
	}
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
