import { create_eslint_rule } from '../utils';

export const RULE_NAME = 'no-import-dist';
export type MessageIds = 'noImportDist';
export type Options = [];

const DIST_PATTERN = /\/dist(\/|$)/;

export default create_eslint_rule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: 'problem',
		docs: {
			description: 'Prevent importing modules in `dist` folder',
		},
		schema: [],
		messages: {
			noImportDist: 'Do not import modules in `dist` folder, got {{path}}',
		},
	},
	defaultOptions: [],
	create: (context) => {
		return {
			ImportDeclaration: (node) => {
				if (isDist(node.source.value)) {
					context.report({
						node,
						messageId: 'noImportDist',
						data: {
							path: node.source.value,
						},
					});
				}
			},
		};
	},
});

function isDist(path: string): boolean {
	return Boolean((path.startsWith('.') && path.match(DIST_PATTERN)))
		|| path === 'dist';
}
