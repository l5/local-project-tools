import { renderYaml } from './renderer.js';

function setTheme(themeKind) {
    const body = document.body;
    if (themeKind === 1) {  // Light theme
        body.classList.remove('vscode-dark');
        body.classList.add('vscode-light');
    } else {  // Dark theme or High Contrast
        body.classList.remove('vscode-light');
        body.classList.add('vscode-dark');
    }
}

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'update') {
        const yamlText = message.text;
        const themeKind = message.theme;
        setTheme(themeKind);
        const outputContainer = document.getElementById('outputContainer');
        const summaryContainer = document.getElementById('summaryContainer');
        renderYaml(yamlText, outputContainer, summaryContainer);
    } else if (message.type === 'updateTheme') {
        setTheme(message.theme);
    }
});

// Request the YAML content and theme initially
window.onload = () => {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: 'requestYaml' });
};
