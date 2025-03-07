const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');


// Bundle renderer.js for the browser
esbuild.build({
  entryPoints: ['../../shared/renderer.js'],
  bundle: true,
  outfile: '../../shared/renderer.browser.js',
  format: 'iife', // For browsers
  globalName: 'Renderer', // Expose the Renderer globally in the browser
  target: ['chrome58', 'firefox57', 'safari11'],
  platform: 'browser',
  sourcemap: true,
  minify: production,
}).catch(() => process.exit(1));

// Bundle renderer.js as an ES module for VS Code
esbuild.build({
  entryPoints: ['./shared/src/renderer.js'],
  bundle: true,
  outfile: './dist/renderer.module.js',
  format: 'esm', // ES module format
  target: ['node14'], // Target Node.js for VS Code
  platform: 'node',
  sourcemap: true,
  minify: production,
}).catch(() => process.exit(1));
