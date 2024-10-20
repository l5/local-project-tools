import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');

    // Register the command to open the YAML preview
    context.subscriptions.push(
        vscode.commands.registerCommand('yamlRenderer.showPreview', () => {
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
                const panel = vscode.window.createWebviewPanel(
                    'yamlRenderer.preview',
                    'YAML Scope Estimator Preview',
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );
                
                // Pass both context and panel to getWebviewContent
                panel.webview.html = getWebviewContent(context, panel);

                // Listen for changes to the document
                const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
                    if (e.document.uri.toString() === document.uri.toString()) {
                        panel.webview.postMessage({ type: 'update', text: e.document.getText() });
                    }
                });

                // Clean up when the panel is disposedv
                panel.onDidDispose(() => {
                    changeDocumentSubscription.dispose();
                });

                // Handle messages from the webview
                panel.webview.onDidReceiveMessage(message => {
                    if (message.type === 'requestYaml') {
                        panel.webview.postMessage({ type: 'update', text: document.getText() });
                    }
                });
            } catch (e) {
                const error = e as Error;
                vscode.window.showErrorMessage(`Failed to open the preview: ${error.message}`);
            }
        })
    );
}

function getWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): string {
    // Use panel.webview.asWebviewUri to load the local script
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.js'));
    const yamlLibUri = vscode.Uri.parse('https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YAML Scope Estimator Preview</title>
            <script src="${yamlLibUri}"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .scope-element {
                    margin-bottom: 20px;
                    padding: 15px;
                    border: 1px solid #ccc;
                    background: #f9f9f9;
                }
                .estimation-card {
                    margin-top: 10px;
                    padding: 10px;
                    border-top: 2px solid #000;
                    background: #e7f3ff;
                }
                .resource-label {
                    display: inline-block;
                    margin: 5px;
                    padding: 5px 10px;
                    border: 1px solid #007acc;
                    background: #cce5ff;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                .summary {
                    margin-top: 20px;
                    padding: 10px;
                    border-top: 2px solid #000;
                }
            </style>
        </head>
        <body>
            <div id="outputContainer"></div>
            <div id="summaryContainer" class="summary"></div>
            <script src="${scriptUri}"></script> <!-- Load webview.js -->
        </body>
        </html>
    `;
}
