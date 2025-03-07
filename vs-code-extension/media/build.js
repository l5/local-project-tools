const fs = require('fs');
const path = require('path');

// Paths
const templatePath = path.join(__dirname, 'index.template.html');
const rendererPath = path.join(__dirname, 'renderer.browser.js');
const outputPath = path.join(__dirname, 'index.html');

// Read the template file and renderer.js
const templateContent = fs.readFileSync(templatePath, 'utf-8');
const rendererContent = fs.readFileSync(rendererPath, 'utf-8');

// Inject renderer.js content into the template
const resultContent = templateContent.replace('<!-- @@RENDERER_JS@@ -->', `<script>\n${rendererContent}\n</script>`);

// Write the result to the final index.html
fs.writeFileSync(outputPath, resultContent);

console.log('index.html generated with the latest renderer.js content.');
