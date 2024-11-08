"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    const disposable = vscode.commands.registerCommand('breathe.start', () => {
        BreathingPanel.createOrShow(context.extensionUri);
    });
    // Create and register the sidebar view provider
    const provider = new BreathingViewProvider(context.extensionUri);
    context.subscriptions.push(disposable, vscode.window.registerWebviewViewProvider('breathing-exercise-view', provider));
}
class BreathingViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getWebviewContent();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'start':
                    vscode.commands.executeCommand('breathe.start');
                    break;
            }
        });
        // Automatically open the breathing panel when sidebar view becomes visible
        BreathingPanel.createOrShow(this._extensionUri);
    }
    _getWebviewContent() {
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Breathing Exercise</title>
				<style>
					body {
						padding: 15px;
						font-family: var(--vscode-font-family);
						color: var(--vscode-foreground);
					}
					.info {
						margin-bottom: 15px;
					}
					.button {
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 8px 12px;
						border-radius: 3px;
						cursor: pointer;
						width: 100%;
					}
				</style>
			</head>
			<body>
				<div class="info">
					Take a moment to breathe and relax.
				</div>
				<div class="info">
					Features:
					<ul>
						<li>Customizable duration</li>
						<li>Visual breathing guide</li>
						<li>Timer display</li>
					</ul>
				</div>
				<button class="button" onclick="startBreathing()">Start Breathing Exercise</button>
				<script>
					const vscode = acquireVsCodeApi();
					
					function startBreathing() {
						vscode.postMessage({ command: 'start' });
					}

					window.addEventListener('message', event => {
						const message = event.data;
					});
				</script>
			</body>
			</html>`;
    }
}
class BreathingPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent(extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Add icon for the panel
        this._panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'breath-icon.svg');
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (BreathingPanel.currentPanel) {
            BreathingPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('breathingExercise', 'Breathing Exercise', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        BreathingPanel.currentPanel = new BreathingPanel(panel, extensionUri);
    }
    _getWebviewContent(extensionUri) {
        const htmlPath = path.join(extensionUri.fsPath, 'src', 'breathView.html');
        return fs.readFileSync(htmlPath, 'utf8');
    }
    dispose() {
        BreathingPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
//# sourceMappingURL=extension.js.map