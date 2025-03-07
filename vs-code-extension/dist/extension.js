"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
// Import vscode and ColorThemeKind
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Extension activated');
    context.subscriptions.push(vscode.commands.registerCommand('yamlRenderer.showPreview', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('No active editor found');
            return;
        }
        const document = activeEditor.document;
        if (document.languageId !== 'yaml' && !document.fileName.endsWith('.projectplan.yml')) {
            vscode.window.showInformationMessage('This is not a valid Project Plan YAML file');
            return;
        }
        try {
            const panel = vscode.window.createWebviewPanel('yamlRenderer.preview', 'YAML Scope Estimator Preview', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            // Pass both context and panel to getWebviewContent
            panel.webview.html = getWebviewContent(context, panel);
            // Send the initial YAML content and the current theme kind (light/dark)
            panel.webview.postMessage({
                type: 'update',
                text: document.getText(),
                theme: vscode.window.activeColorTheme.kind // Pass the theme information
            });
            // Listen for changes to the document and update the webview content
            const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() === document.uri.toString()) {
                    panel.webview.postMessage({
                        type: 'update',
                        text: e.document.getText(),
                        theme: vscode.window.activeColorTheme.kind
                    });
                }
            });
            // Clean up when the panel is disposed
            panel.onDidDispose(() => {
                changeDocumentSubscription.dispose();
            });
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(message => {
                if (message.type === 'requestYaml') {
                    panel.webview.postMessage({
                        type: 'update',
                        text: document.getText(),
                        theme: vscode.window.activeColorTheme.kind
                    });
                }
            });
            // Update theme if it changes
            vscode.window.onDidChangeActiveColorTheme(theme => {
                panel.webview.postMessage({
                    type: 'updateTheme',
                    theme: theme.kind
                });
            });
        }
        catch (e) {
            const error = e;
            vscode.window.showErrorMessage(`Failed to open the preview: ${error.message}`);
        }
    }));
}
function getWebviewContent(context, panel) {
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.bundle.js'));
    const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css'));
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YAML Scope Estimator Preview</title>
            <link rel="stylesheet" href="${styleUri}">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
        </head>
        <body>
            <div id="renderedOutput">
                <h3>Scope Elements</h3>
                <div id="outputContainer"></div>
                <div id="summaryContainer" class="summary"></div>
            </div>
            <script src="${scriptUri}"></script>
            <div style="position: absolute; bottom: 10px; right: 30px; font-size: 0.7em; color: #aaaaaa;">
                <a href="https://l5.github.io/local-project-tools/" target="_blank" style="text-decoration: none; color: #aaaaaa;">
                    Generated by Local Project Tools
                </a>
            </div>
        </body>
        </html>
    `;
}
//# sourceMappingURL=extension.js.map