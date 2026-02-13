import * as vscode from 'vscode';
import type { PackageScriptBarConfig } from './types';

const CONFIG_FILENAME = 'package-script-bar.json';
const VSCODE_DIR = '.vscode';

export class ConfigManager {
	private configPath: vscode.Uri | undefined;
	private _config: PackageScriptBarConfig = {};
	private fileWatcher: vscode.FileSystemWatcher | undefined;
	private onConfigChanged: (() => void) | undefined;

	constructor() {}

	get workspaceRoot(): vscode.Uri | undefined {
		const folder = vscode.workspace.workspaceFolders?.[0];
		return folder?.uri;
	}

	get configFilePath(): vscode.Uri | undefined {
		return this.configPath;
	}

	private getConfigPath(): vscode.Uri | undefined {
		const root = this.workspaceRoot;
		if (!root) {return undefined;}
		return vscode.Uri.joinPath(root, VSCODE_DIR, CONFIG_FILENAME);
	}

	/**
	 * Initialize - call when workspace is available
	 */
	async init(onChanged?: () => void): Promise<void> {
		this.onConfigChanged = onChanged;
		this.configPath = this.getConfigPath();
		if (!this.configPath) {return;}

		await this.load();

		// Watch for external changes (only when we have a workspace)
		if (this.configPath && vscode.workspace.workspaceFolders?.length) {
			this.fileWatcher = vscode.workspace.createFileSystemWatcher(
				`**/${VSCODE_DIR}/${CONFIG_FILENAME}`,
				false,
				false,
				false
			);
			this.fileWatcher.onDidChange(() => this.load().then(() => this.onConfigChanged?.()));
			this.fileWatcher.onDidCreate(() => this.load().then(() => this.onConfigChanged?.()));
			this.fileWatcher.onDidDelete(() => {
				this._config = {};
				this.onConfigChanged?.();
			});
		}
	}

	dispose(): void {
		this.fileWatcher?.dispose();
		this.fileWatcher = undefined;
	}

	get config(): PackageScriptBarConfig {
		return this._config;
	}

	get scriptsConfig(): Record<string, Partial<import('./types').ScriptConfig>> {
		return this._config.scripts ?? {};
	}

	async load(): Promise<PackageScriptBarConfig> {
		if (!this.configPath) {
			this._config = {};
			return this._config;
		}

		try {
			const bytes = await vscode.workspace.fs.readFile(this.configPath);
			const text = new TextDecoder().decode(bytes);
			this._config = JSON.parse(text) as PackageScriptBarConfig;
			if (!this._config.scripts) {this._config.scripts = {};}
			return this._config;
		} catch (err) {
			// File doesn't exist or invalid JSON
			this._config = { scripts: {} };
			return this._config;
		}
	}

	async save(config: PackageScriptBarConfig): Promise<void> {
		if (!this.configPath) {return;}

		const vscodeDir = vscode.Uri.joinPath(this.configPath, '..');
		try {
			await vscode.workspace.fs.createDirectory(vscodeDir);
		} catch {
			// Directory may already exist
		}

		const text = JSON.stringify(config, null, 2);
		await vscode.workspace.fs.writeFile(
			this.configPath,
			new TextEncoder().encode(text)
		);
		this._config = config;
	}

	async updateScripts(scripts: Record<string, Partial<import('./types').ScriptConfig>>): Promise<void> {
		const newConfig: PackageScriptBarConfig = {
			...this._config,
			scripts: { ...scripts },
		};
		await this.save(newConfig);
	}

	/**
	 * Ensure config file exists (create with empty object if missing)
	 */
	async ensureExists(): Promise<void> {
		if (!this.configPath) {return;}
		try {
			await vscode.workspace.fs.stat(this.configPath);
		} catch {
			await this.save({ scripts: {} });
		}
	}
}
