import { parse, Import, Stylesheet } from 'css';
import { urlToRequest } from 'loader-utils';

const betweenQuotesPattern = /('|")(.*?)\1/;
const unpackUrlPattern = /url\(([^\)]+)\)/;
const inlineLoader = '!css2json-loader?useForImports!';

export default function loader(content: string, map: any) {
	const options = this.getOptions() || {};
	const inline = !!options.useForImports;
	const requirePrefix = inline ? inlineLoader : '';

	const ast = parse(content);

	let dependencies = [];
	getImportRules(ast)
		.map(extractUrlFromRule)
		.map(createRequireUri)
		.forEach(({ uri, requireURI }) => {
			dependencies.push(
				`global.registerModule("${uri}", () => require("${requirePrefix}${requireURI}"));`
			);

			// Call registerModule with requireURI to handle cases like @import "~@nativescript/theme/css/blue.css";
			if (uri !== requireURI) {
				dependencies.push(
					`global.registerModule("${requireURI}", () => require("${requirePrefix}${requireURI}"));`
				);
			}
		});

	const str = JSON.stringify(ast, (k, v) => (k === 'position' ? undefined : v));

	// map.mappings = map.mappings.replace(/;{2,}/, '')

	this.callback(
		null,
		`${dependencies.join('\n')}module.exports = ${str};`,
		null
	);
}

function getImportRules(ast: Stylesheet): Import[] {
	if (!ast || (<any>ast).type !== 'stylesheet' || !ast.stylesheet) {
		return [];
	}
	return <Import[]>(
		ast.stylesheet.rules.filter(
			(rule) => rule.type === 'import' && (<any>rule).import
		)
	);
}

/**
 * Extracts the url from import rule (ex. `url("./platform.css")`)
 */
function extractUrlFromRule(importRule: Import): string {
	const urlValue = importRule.import;

	const unpackedUrlMatch = urlValue.match(unpackUrlPattern);
	const unpackedValue = unpackedUrlMatch ? unpackedUrlMatch[1] : urlValue;

	const quotesMatch = unpackedValue.match(betweenQuotesPattern);
	return quotesMatch ? quotesMatch[2] : unpackedValue;
}

function createRequireUri(uri): { uri: string; requireURI: string } {
	return {
		uri: uri,
		requireURI: urlToRequest(uri),
	};
}
