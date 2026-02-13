# Package Script Bar

A VS Code extension that displays a streamlined toolbar at the bottom of the editor with clickable buttons for your root `package.json` scripts. Run scripts with one click—in the background or in a terminal.

**Author:** [bryanthaboi](https://github.com/bryanthaboi)

## Features

- **Script Bar Panel**: A compact toolbar in the bottom left panel with buttons for each enabled script
- **Enable/Disable Scripts**: Choose which scripts appear in the bar via the config file
- **Nicknames**: Give scripts short labels (e.g., `build:prod` → `Build Prod`) for cleaner buttons
- **Custom Colors**: Set a color for each script button
- **Run Modes**:
  - **Background** (default): Runs silently, shows a notification when complete
  - **Terminal**: Opens a visible terminal and runs the script
- **Rescan**: Detects new scripts in `package.json` without overwriting your existing enable/disable, nicknames, or colors
- **Team Config**: Uses `.vscode/package-script-bar.json` so teams can share script preferences via Git

## Requirements

- VS Code ^1.109.0
- A workspace folder with a root `package.json` containing a `scripts` section

## Quick Start

1. Open a folder that has a `package.json` with scripts
2. Open the **Script Bar** panel (bottom panel, look for the Script Bar tab with the run icon)
3. Click any script button to run it

## Configuration

### VS Code Settings

| Setting                                | Description                                       | Default        |
| -------------------------------------- | ------------------------------------------------- | -------------- |
| `package-script-bar.defaultRunMode`    | `"background"` or `"terminal"`                    | `"background"` |
| `package-script-bar.showNotifications` | Show completion notifications for background runs | `true`         |

### Workspace Config (`.vscode/package-script-bar.json`)

This file is created automatically when you use the extension. Edit it to customize scripts. Use **Open Script Bar Config** from the Command Palette or the panel title bar.

**Config schema:**

```json
{
	"scripts": {
		"build": {
			"enabled": true,
			"nickname": "Build",
			"color": "#4CAF50",
			"runMode": "background"
		},
		"test": {
			"enabled": false,
			"nickname": "Test",
			"color": "#2196F3",
			"runMode": "terminal"
		}
	}
}
```

| Field      | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `enabled`  | Show this script in the bar (`true`) or hide it (`false`)         |
| `nickname` | Short label for the button (e.g., `"Build"` instead of `"build"`) |
| `color`    | Hex color for the button (e.g., `"#4CAF50"`)                      |
| `runMode`  | `"background"` or `"terminal"` for this script                    |

### Rescan package.json

Use **Rescan package.json** (refresh icon in the panel title bar or Command Palette) when you:

- Add new scripts to `package.json`
- Remove scripts (config for removed scripts is cleaned up)
- Want to pick up changes without losing your existing preferences

Rescan merges with your config: new scripts get defaults, existing scripts keep your settings, and removed scripts are dropped.

## Team Sharing

Commit `.vscode/package-script-bar.json` to your repo so everyone gets the same script bar setup. New scripts from `package.json` will appear for everyone; each teammate can run **Rescan** if they add scripts locally.

## Commands

| Command                                      | Description                            |
| -------------------------------------------- | -------------------------------------- |
| `Package Script Bar: Rescan package.json`    | Rescan scripts and merge with config   |
| `Package Script Bar: Open Script Bar Config` | Open `.vscode/package-script-bar.json` |

## Release Notes

### 0.0.1

Initial release of Package Script Bar.
