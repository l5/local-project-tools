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
                    'yamlRenderer.preview',  // Identifies the type of the webview panel
                    'YAML Scope Estimator Preview', // Title of the panel displayed to the user
                    vscode.ViewColumn.Beside, // Open beside the editor
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                // Set the HTML content for the webview panel
                panel.webview.html = getWebviewContent(document.getText());

                // Listen for changes to the document
                const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
                    if (e.document.uri.toString() === document.uri.toString()) {
                        panel.webview.html = getWebviewContent(e.document.getText());
                    }
                });

                // Clean up when the panel is disposed
                panel.onDidDispose(() => {
                    changeDocumentSubscription.dispose();
                });
            } catch (e) {
                const error = e as Error;
                vscode.window.showErrorMessage(`Failed to open the preview: ${error.message}`);
            }
        })
    );

    // Register a custom preview button in the editor toolbar
    context.subscriptions.push(
        vscode.window.registerWebviewPanelSerializer('yamlRenderer.preview', new PreviewSerializer())
    );
}

class PreviewSerializer implements vscode.WebviewPanelSerializer {
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        // Reset the content of the webview panel when it is restored
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

        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = getWebviewContent(document.getText());
    }
}

function getWebviewContent(yamlText: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YAML Scope Estimator Preview</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
        </head>
        <body>
            <div id="outputContainer"></div>
            <script>
                (function() {
                    try {
                        const yamlText = ${JSON.stringify(yamlText)};
                        renderYaml(yamlText);
                    } catch (e) {
                        document.body.innerHTML = '<p style="color: red;">Error parsing initial YAML: ' + e.message + '</p>';
                    }

                    function renderYaml(yamlText) {
                        const outputContainer = document.getElementById('outputContainer');
                        outputContainer.innerHTML = '';

                        try {
                            const parsedYaml = jsyaml.load(yamlText);
                            outputContainer.innerHTML = JSON.stringify(parsedYaml, null, 2);
                        } catch (e) {
                            outputContainer.innerHTML = '<p style="color: red;">Error parsing YAML: ' + e.message + '</p>';
                        }
                    }
                }());
            </script>
        </body>
        </html>
    `;
}

export function deactivate() {}
