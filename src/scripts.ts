import * as vscode from 'vscode';
import type { ConfigManager } from './config';
import type { ScriptConfig, ScriptItem } from './types';
import { DEFAULT_SCRIPT_CONFIG, DEFAULT_COLORS } from './types';

const EXTENSION_ID = 'package-script-bar';

function getDefaultRunMode(): 'background' | 'terminal' {
	return vscode.workspace.getConfiguration(EXTENSION_ID).get<'background' | 'terminal'>('defaultRunMode', 'background');
}

interface PackageJson {
	scripts?: Record<string, string>;
}

export class ScriptManager {
	private colorIndex = 0;

	constructor(private configManager: ConfigManager) {}

	get workspaceRoot(): string | undefined {
		return this.configManager.workspaceRoot?.fsPath;
	}

	/**
	 * Get all scripts merged with config. Only returns enabled scripts for display.
	 */
	async getScripts(): Promise<ScriptItem[]> {
		const root = this.configManager.workspaceRoot;
		if (!root) {return [];}

		const pkgUri = vscode.Uri.joinPath(root, 'package.json');
		let pkg: PackageJson;
		try {
			const bytes = await vscode.workspace.fs.readFile(pkgUri);
			pkg = JSON.parse(new TextDecoder().decode(bytes)) as PackageJson;
		} catch {
			return [];
		}

		const rawScripts = pkg.scripts;
		if (!rawScripts || typeof rawScripts !== 'object') {return [];}

		await this.configManager.load();
		const savedConfig = this.configManager.scriptsConfig;

		const items: ScriptItem[] = [];
		this.colorIndex = 0;

		for (const [name, cmd] of Object.entries(rawScripts)) {
			if (typeof cmd !== 'string') {continue;}

			const saved = savedConfig[name];
			const config: ScriptConfig = {
				...DEFAULT_SCRIPT_CONFIG,
				...(saved ?? {}),
				enabled: saved?.enabled ?? true,
				runMode: saved?.runMode ?? getDefaultRunMode(),
				nickname: saved?.nickname ?? this.formatNickname(name),
				color: saved?.color ?? DEFAULT_COLORS[this.colorIndex++ % DEFAULT_COLORS.length],
			};

			if (config.enabled) {
				items.push({ name, config });
			}
		}

		return items;
	}

	/**
	 * Rescan package.json, merge with existing config, persist. Preserves user
	 * preferences for scripts that still exist. Removes config for deleted scripts.
	 */
	async rescan(): Promise<ScriptItem[]> {
		const root = this.configManager.workspaceRoot;
		if (!root) {return [];}

		const pkgUri = vscode.Uri.joinPath(root, 'package.json');
		let pkg: PackageJson;
		try {
			const bytes = await vscode.workspace.fs.readFile(pkgUri);
			pkg = JSON.parse(new TextDecoder().decode(bytes)) as PackageJson;
		} catch {
			await this.configManager.updateScripts({});
			return [];
		}

		const rawScripts = pkg.scripts;
		if (!rawScripts || typeof rawScripts !== 'object') {
			await this.configManager.updateScripts({});
			return [];
		}

		const currentConfig = { ...this.configManager.scriptsConfig };
		const newConfig: Record<string, Partial<ScriptConfig>> = {};
		this.colorIndex = 0;

		for (const name of Object.keys(rawScripts)) {
			const saved = currentConfig[name];
			const existing = saved && typeof saved === 'object';

			newConfig[name] = {
				enabled: existing ? (saved.enabled ?? true) : true,
				runMode: existing ? (saved.runMode ?? getDefaultRunMode()) : getDefaultRunMode(),
				nickname: existing && saved.nickname ? saved.nickname : this.formatNickname(name),
				color: existing && saved.color ? saved.color : DEFAULT_COLORS[this.colorIndex++ % DEFAULT_COLORS.length],
			};
		}

		await this.configManager.updateScripts(newConfig);
		return this.getScripts();
	}

	/**
	 * Get all scripts including disabled (for settings/editing). Used when we need
	 * full list to edit nicknames, colors, etc.
	 */
	async getAllScriptsWithConfig(): Promise<ScriptItem[]> {
		const root = this.configManager.workspaceRoot;
		if (!root) {return [];}

		const pkgUri = vscode.Uri.joinPath(root, 'package.json');
		let pkg: PackageJson;
		try {
			const bytes = await vscode.workspace.fs.readFile(pkgUri);
			pkg = JSON.parse(new TextDecoder().decode(bytes)) as PackageJson;
		} catch {
			return [];
		}

		const rawScripts = pkg.scripts;
		if (!rawScripts || typeof rawScripts !== 'object') {return [];}

		await this.configManager.load();
		const savedConfig = this.configManager.scriptsConfig;
		const items: ScriptItem[] = [];
		this.colorIndex = 0;

		for (const name of Object.keys(rawScripts)) {
			const saved = savedConfig[name];
			const config: ScriptConfig = {
				...DEFAULT_SCRIPT_CONFIG,
				...(saved ?? {}),
				enabled: saved?.enabled ?? true,
				runMode: saved?.runMode ?? getDefaultRunMode(),
				nickname: saved?.nickname ?? this.formatNickname(name),
				color: saved?.color ?? DEFAULT_COLORS[this.colorIndex++ % DEFAULT_COLORS.length],
			};
			items.push({ name, config });
		}

		return items;
	}

	private formatNickname(name: string): string {
		// "build:prod" -> "Build Prod"
		return name
			.split(/[-_:]/)
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
			.join(' ');
	}

	/**
	 * Check if we're in a valid state (workspace with package.json)
	 */
	async getState(): Promise<'no-workspace' | 'no-package' | 'no-scripts' | 'ready'> {
		if (!this.configManager.workspaceRoot) {return 'no-workspace';}

		const pkgUri = vscode.Uri.joinPath(this.configManager.workspaceRoot, 'package.json');
		let pkg: PackageJson;
		try {
			const bytes = await vscode.workspace.fs.readFile(pkgUri);
			pkg = JSON.parse(new TextDecoder().decode(bytes)) as PackageJson;
		} catch {
			return 'no-package';
		}

		const scripts = pkg.scripts;
		if (!scripts || typeof scripts !== 'object' || Object.keys(scripts).length === 0) {
			return 'no-scripts';
		}

		return 'ready';
	}
}
