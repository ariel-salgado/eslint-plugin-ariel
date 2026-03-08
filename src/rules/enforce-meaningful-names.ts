import { create_eslint_rule } from '../utils';

export const RULE_NAME = 'enforce-meaningful-names';

export interface MeaningfulNamesOptions {
	minLength?: number;
	allowedNames?: string[];
	disallowedNames?: string[];
}

export type MessageIds
	= | 'nameTooShort'
		| 'nameNotMeaningful'
		| 'nameDisallowed';

export type Options = [MeaningfulNamesOptions?];

const VOWEL_PATTERN = /[aeiouy]/i;
const CONSONANT_PATTERN = /[bcdfghj-np-tvwxz]/i;

export default create_eslint_rule<Options, MessageIds>({
	name: RULE_NAME,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce meaningful variable and function names',
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					minLength: {
						type: 'number',
						minimum: 1,
						default: 2,
					},
					allowedNames: {
						type: 'array',
						items: { type: 'string' },
						default: ['i', 'j', 'k', 'x', 'y', 'z'],
					},
					disallowedNames: {
						type: 'array',
						items: { type: 'string' },
						default: ['temp', 'tmp', 'foo', 'bar', 'baz'],
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			nameTooShort:
				'Name "{{name}}" is too short (minimum {{minLength}} characters).',
			nameNotMeaningful:
				'Name "{{name}}" is not meaningful enough. Consider using a more descriptive name.',
			nameDisallowed:
				'Name "{{name}}" is not allowed. Consider using a more descriptive name.',
		},
	},

	defaultOptions: [{}],

	create(context, [options]) {
		const minLength = options?.minLength ?? 2;
		const allowedNames = new Set(
			options?.allowedNames ?? ['i', 'j', 'k', 'x', 'y', 'z'],
		);
		const disallowedNames = new Set(
			options?.disallowedNames ?? ['temp', 'tmp', 'foo', 'bar', 'baz'],
		);

		function checkName(name: string, node: any): void {
			if (allowedNames.has(name))
				return;

			if (disallowedNames.has(name)) {
				context.report({
					node,
					messageId: 'nameDisallowed',
					data: { name },
				});
				return;
			}

			if (name.length < minLength) {
				context.report({
					node,
					messageId: 'nameTooShort',
					data: { name, minLength },
				});
				return;
			}

			const hasVowel = VOWEL_PATTERN.test(name);
			const hasConsonant = CONSONANT_PATTERN.test(name);

			if (!hasVowel || !hasConsonant) {
				context.report({
					node,
					messageId: 'nameNotMeaningful',
					data: { name },
				});
			}
		}

		function checkParams(params: any[]): void {
			for (const param of params) {
				if (param.type === 'Identifier') {
					checkName(param.name, param);
				}
			}
		}

		return {
			FunctionDeclaration(node: any) {
				if (node.id)
					checkName(node.id.name, node.id);
				checkParams(node.params);
			},

			FunctionExpression(node: any) {
				if (node.id)
					checkName(node.id.name, node.id);
				checkParams(node.params);
			},

			ArrowFunctionExpression(node: any) {
				checkParams(node.params);
			},

			VariableDeclarator(node: any) {
				if (node.id.type === 'Identifier') {
					checkName(node.id.name, node.id);
				}
			},

			Property(node: any) {
				if (node.key.type === 'Identifier' && !node.computed) {
					checkName(node.key.name, node.key);
				}
			},
		};
	},
});
