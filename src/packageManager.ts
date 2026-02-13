import * as vscode from 'vscode';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const LOCKFILES: { file: string; manager: PackageManager }[] = [
	{ file: 'pnpm-lock.yaml', manager: 'pnpm' },
	{ file: 'yarn.lock', manager: 'yarn' },
	{ file: 'bun.lockb', manager: 'bun' },
	{ file: 'package-lock.json', manager: 'npm' },
];

/**
 * Detect the package manager for the given directory by checking for lockfiles.
 * Order: pnpm-lock.yaml > yarn.lock > bun.lockb > package-lock.json > npm (default)
 */
export async function detectPackageManager(cwd: string): Promise<PackageManager> {
	const rootUri = vscode.Uri.file(cwd);
	for (const { file, manager } of LOCKFILES) {
		const fileUri = vscode.Uri.joinPath(rootUri, file);
		try {
			await vscode.workspace.fs.stat(fileUri);
			return manager;
		} catch {
			// File doesn't exist, try next
		}
	}
	return 'npm';
}

/**
 * Get the run command for a package manager.
 * Returns [cmd, args] for spawn, or the full command string for terminal.
 */
export function getRunCommand(
	manager: PackageManager,
	scriptName: string
): { cmd: string; args: string[] } {
	switch (manager) {
		case 'pnpm':
			return { cmd: 'pnpm', args: ['run', scriptName] };
		case 'yarn':
			return { cmd: 'yarn', args: ['run', scriptName] };
		case 'bun':
			return { cmd: 'bun', args: ['run', scriptName] };
		case 'npm':
		default:
			return { cmd: 'npm', args: ['run', scriptName] };
	}
}
