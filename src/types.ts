/**
 * Per-script configuration stored in .vscode/package-script-bar.json
 */
export interface ScriptConfig {
	enabled: boolean;
	nickname?: string;
	color?: string;
	runMode: 'background' | 'terminal';
}

/**
 * Merged script with config applied - what we show in the UI
 */
export interface ScriptItem {
	name: string;
	config: ScriptConfig;
}

/**
 * Config file schema for .vscode/package-script-bar.json
 */
export interface PackageScriptBarConfig {
	scripts?: Record<string, Partial<ScriptConfig>>;
}

/**
 * Default config for new scripts
 */
export const DEFAULT_SCRIPT_CONFIG: ScriptConfig = {
	enabled: true,
	runMode: 'background',
};

/**
 * Default button color palette for scripts
 */
export const DEFAULT_COLORS = [
	'#4CAF50', // green
	'#2196F3', // blue
	'#FF9800', // orange
	'#9C27B0', // purple
	'#00BCD4', // cyan
	'#E91E63', // pink
];
