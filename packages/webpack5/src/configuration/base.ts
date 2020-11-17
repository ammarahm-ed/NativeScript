import Config from 'webpack-chain';
import { IWebpackEnv, WebpackPlatform } from './index';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { getDistPath } from '../helpers/projectHelpers';
import { DefinePlugin } from 'webpack';
import { WatchStateLoggerPlugin } from '../plugins/WatchStateLoggerPlugin';

// todo: add base configuration that's shared across all flavors
export default function (env: IWebpackEnv): Config {
	const config = new Config();
	const distPath = getDistPath(env);
	const platform = determinePlatformFromEnv(env);

	// look for loaders in
	//  - @nativescript/webpack/loaders
	//  - node_modules
	config.resolveLoader.modules.add('@nativescript/webpack/loaders').add('node_modules');

	// inspector_modules
	config.when(shouldIncludeInspectorModules(env), (config) => {
		config.entry('inspector_modules').add('tns_modules/@nativescript/core/inspector_modules').end();
	});

	config.entry('bundle').add('todo/main').end();

	// base aliases
	config.resolve.alias.set('~/package.json', 'package.json').set('~', '<TODO>appFullPath').set('@', '<TODO>appFullPath');

	// resolve symlinks
	config.resolve.symlinks(true);

	// set up ts support
	config.module
		.rule('ts')
		.test(/\.ts$/)
		.use('ts-loader')
		.loader('ts-loader')
		.options({
			// configFile: '',
			transpileOnly: true,
			allowTsInNodeModules: true,
			compilerOptions: {
				sourceMap: true,
				declaration: false,
			},
			getCustomTransformers() {
				return {
					before: [
						// todo: transform NativeClass
					],
				};
			},
		});

	// set up js
	// todo: do we need babel-loader? It's useful to support it
	config.module.rule('js').test(/\.js$/).use('babel-loader').loader('babel-loader');

	// set up css
	config.module
		.rule('css')
		.test(/\.css$/)
		.use('css2json-loader')
		.loader('css2json-loader')
		.end()
		.use('css-loader')
		.loader('css-loader');

	// set up scss
	config.module
		.rule('scss')
		.test(/\.scss$/)
		.use('css2json-loader')
		.loader('css2json-loader')
		.end()
		.use('scss-loader')
		.loader('scss-loader');

	// items to clean
	config.plugin('clean').use(CleanWebpackPlugin, [
		{
			cleanOnceBeforeBuildPatterns: [`${distPath}/**/*`],
			verbose: true,
		},
	]);

	// todo: refine defaults
	config.plugin('define').use(DefinePlugin, [
		{
			'global.NS_WEBPACK': true,
			'global.isAndroid': platform === WebpackPlatform.android,
			'global.isIOS': platform === WebpackPlatform.ios,
			process: 'global.process',
		},
	]);

	// todo: we should probably move away from CopyWebpackPlugin
	// it has many issues we can solve by simply copying files **before** the build even starts
	// this is just a temp inline plugin that does nothing while building out the configs.
	config.plugin('copy').use(function CopyPluginTemp() {}, [
		{
			patterns: [],
		},
	]);

	// add the WatchStateLogger plugin used to notify the CLI of build state
	config.plugin('watch-state-logger').use(WatchStateLoggerPlugin);

	return config;
}

function shouldIncludeInspectorModules(env: IWebpackEnv): boolean {
	const platform = determinePlatformFromEnv(env);
	// todo: check if core modules are external
	// todo: check if we are testing
	return platform === WebpackPlatform.ios;
}

function determinePlatformFromEnv(env: IWebpackEnv): WebpackPlatform {
	if (env?.android) {
		return WebpackPlatform.android;
	}

	if (env?.ios) {
		return WebpackPlatform.ios;
	}

	throw new Error('You need to provide a target platform!');
}
