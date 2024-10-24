import { renderYaml } from './renderer.js';

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('yamlTextarea');
    const cursorPosition = document.getElementById('cursorPosition');
    const outputContainer = document.getElementById('outputContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    
    // Toggle functionality for hiding/showing the input textarea
    const toggleButton = document.getElementById('toggleButton');
    let isHidden = false;
    toggleButton.addEventListener('click', () => {
        const yamlInput = document.getElementById('yamlInput');
        const renderedOutput = document.getElementById('renderedOutput');

        isHidden = !isHidden;
        if (isHidden) {
            yamlInput.style.display = 'none';
            cursorPosition.style.display = 'none';
            renderedOutput.style.width = '100%';
        } else {
            yamlInput.style.display = 'block';
            cursorPosition.style.display = 'block';
            yamlInput.style.width = '50%';
            renderedOutput.style.width = '50%';
        }
    });

    // Update cursor position when typing
    textarea.addEventListener('input', () => {
        updateCursorPosition(textarea);
        renderYaml(textarea.value, outputContainer, summaryContainer);  // Render YAML when input changes
    });
    textarea.addEventListener('click', () => updateCursorPosition(textarea));
    textarea.addEventListener('keyup', () => updateCursorPosition(textarea));

    // Initialize cursor position
    updateCursorPosition(textarea);

    // Render YAML on page load if present
    if (textarea.value) {
        renderYaml(textarea.value, outputContainer, summaryContainer);
    }

    function updateCursorPosition(textarea) {
        const text = textarea.value.substr(0, textarea.selectionStart);
        const lines = text.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        cursorPosition.textContent = `Line: ${line}, Column: ${column}`;
    }
});
