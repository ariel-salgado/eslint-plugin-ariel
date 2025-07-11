import type { Rule } from 'eslint';
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import type { RuleListener, RuleWithMeta, RuleWithMetaAndName } from '@typescript-eslint/utils/eslint-utils';

const has_docs = ['']

const blob_url = 'https://github.com/ariel-salgado/eslint-plugin-ariel/blob/main/src/rules/';

export type RuleModule<
  T extends readonly unknown[],
> = Rule.RuleModule & {
  defaultOptions: T
}

/**
 * Creates reusable function to create rules with default options and docs URLs.
 *
 * @param url_creator Creates a documentation URL for a given rule name.
 * @returns Function to create a rule with the docs URL format.
 */
function rule_creator(url_creator: (name: string) => string) {
    return function create_named_rule<
		TOptions extends readonly unknown[],
		TMessageIds extends string,
    >({
		name,
		meta,
		...rule
    }: Readonly<
		RuleWithMetaAndName<TOptions, TMessageIds>
    >): RuleModule<TOptions> {
      	return create_rule<TOptions, TMessageIds>({
			meta: {
			...meta,
			docs: {
				...meta.docs,
				url: url_creator(name),
			},
			},
			...rule,
		})
    }
  }

/**
 * Creates a well-typed TSESLint custom ESLint rule without a docs URL.
 *
 * @returns Well-typed TSESLint custom ESLint rule.
 * @remarks It is generally better to provide a docs URL function to rule_creator.
 */
function create_rule<
	TOptions extends readonly unknown[],
	TMessageIds extends string,
>({
	create,
	defaultOptions: default_options,
	meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TOptions> {
	return {
		create: ((
			context: Readonly<RuleContext<TMessageIds, TOptions>>,
		): RuleListener => {
			const options_with_default = context.options.map((options, index) => {
				return {
				...default_options[index] || {},
				...options || {},
				}
			}) as unknown as TOptions
			return create(context, options_with_default)
		}) as any,
		defaultOptions: default_options,
		meta: meta as any,
	}
}

export const create_eslint_rule = rule_creator(
  rule_name => has_docs.includes(rule_name)
    ? `${blob_url}${rule_name}.md`
    : `${blob_url}${rule_name}.test.ts`,
) as any as <TOptions extends readonly unknown[], TMessageIds extends string>({ name, meta, ...rule }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>) => RuleModule<TOptions>

const warned = new Set<string>()

export function warn_once(message: string): void {
	if (warned.has(message))
		return
	
	warned.add(message)
	console.warn(message)
}