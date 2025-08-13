import type { ESLint, Linter } from 'eslint';

import { version } from '../package.json';

import curly from './rules/curly';
import if_newline from './rules/if-newline';
import import_dedupe from './rules/import-dedupe';
import prefer_for_of from './rules/prefer-for-of';
import no_import_dist from './rules/no-import-dist';
import top_level_function from './rules/top-level-function';
import consistent_chaining from './rules/consistent-chaining';
import consistent_list_newline from './rules/consistent-list-newline';
import no_import_node_modules_by_path from './rules/no-import-node-modules-by-path';

export const plugin = {
	meta: {
		name: 'ariel',
		version,
	},
	rules: {
		'consistent-chaining': consistent_chaining,
		'consistent-list-newline': consistent_list_newline,
		'curly': curly,
		'if-newline': if_newline,
		'import-dedupe': import_dedupe,
		'no-import-dist': no_import_dist,
		'no-import-node-modules-by-path': no_import_node_modules_by_path,
		'top-level-function': top_level_function,
		'prefer-for-of': prefer_for_of,
	},
} satisfies ESLint.Plugin;

export default plugin;

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
	[K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions']
};

export type Rules = {
	[K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
};
