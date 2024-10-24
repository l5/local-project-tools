const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function buildRendererForBrowser() {
	console.log("browser...")
	await esbuild.build({
		entryPoints: ['../../shared/renderer.js'],
		bundle: true,
		format: 'iife', // For the browser
		minify: production,
		outfile: '../../shared/renderer.browser.js',
		globalName: 'Renderer', // Expose functions globally in the browser
		target: ['chrome58', 'firefox57'], // Adjust browser target as needed
	});
}

async function buildRendererForModule() {
	await esbuild.build({
		entryPoints: ['../../shared/renderer.js'],
		bundle: true,
		format: 'esm', // For VS Code extension (ESM)
		minify: production,
		outfile: 'dist/renderer.module.js',
		target: ['node14'], // Node.js target for VS Code
	});
}

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs', // CommonJS for VS Code extension
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			esbuildProblemMatcherPlugin,
		],
	});

	// Build the renderer for both browser and module
	await buildRendererForBrowser();
	await buildRendererForModule();

	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
