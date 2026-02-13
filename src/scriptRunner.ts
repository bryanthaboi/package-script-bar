import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { detectPackageManager, getRunCommand } from './packageManager';

const EXTENSION_ID = 'package-script-bar';

export type RunMode = 'background' | 'terminal';

export async function runScript(
	scriptName: string,
	runMode: RunMode,
	cwd: string
): Promise<void> {
	const showNotifications = vscode.workspace
		.getConfiguration(EXTENSION_ID)
		.get<boolean>('showNotifications', true);

	const manager = await detectPackageManager(cwd);
	const { cmd, args } = getRunCommand(manager, scriptName);
	const runCmd = [cmd, ...args].join(' ');

	if (runMode === 'terminal') {
		const terminal = vscode.window.createTerminal({
			name: `${cmd} run ${scriptName}`,
			cwd,
		});
		terminal.show();
		terminal.sendText(runCmd);
		return;
	}

	// Background: spawn process, notify on completion
	const isWindows = process.platform === 'win32';
	const spawnCmd = isWindows ? 'cmd.exe' : cmd;
	const spawnArgs = isWindows ? ['/c', cmd, ...args] : args;

	const child = spawn(spawnCmd, spawnArgs, {
		cwd,
		shell: !isWindows,
		stdio: 'pipe',
	});

	child.on('close', (code, signal) => {
		if (!showNotifications) {return;}
		if (code === 0) {
			vscode.window.showInformationMessage(`Script "${scriptName}" completed successfully.`);
		} else {
			const msg = signal
				? `Script "${scriptName}" was terminated (${signal}).`
				: `Script "${scriptName}" exited with code ${code}.`;
			vscode.window.showWarningMessage(msg);
		}
	});

	child.on('error', (err) => {
		vscode.window.showErrorMessage(`Failed to run "${scriptName}": ${err.message}`);
	});
}
